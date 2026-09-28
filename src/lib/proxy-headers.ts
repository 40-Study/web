/**
 * Same-origin API proxy — request/response helpers.
 *
 * Extracted from `src/app/api/[...path]/route.ts` because a Next.js App
 * Router route file may only export HTTP method handlers (`GET`, `POST`, …)
 * plus a small allow-listed set of config keys (`runtime`, `dynamic`, …).
 * Any other export (a plain helper function/const) fails the generated
 * route-type constraint at build time — see plans/reports/tester-260909-1340-build-test-baseline.md.
 */
import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosRequestHeaders } from "axios";

const BACKEND_TIMEOUT_MS = 15_000;
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export const PROXY_FAILURE = {
  error: {
    code: "BAD_GATEWAY",
    message: "Backend service unavailable",
  },
} as const;

function resolveBackendUrl(request: NextRequest): string {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, "");
  }

  const hostHeader =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.hostname;
  const host = (hostHeader || "").toLowerCase();
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return "http://127.0.0.1:5000";
  }

  return "https://api.fortex.ai.vn";
}

function connectionHeaderNames(headers: Headers): Set<string> {
  const names = new Set<string>();
  for (const name of (headers.get("connection") ?? "").split(",")) {
    const normalized = name.trim().toLowerCase();
    if (normalized) names.add(normalized);
  }
  return names;
}

export function copyEndToEndHeaders(source: Headers, options: { request: boolean }): Headers {
  const result = new Headers();
  const connectionHeaders = connectionHeaderNames(source);

  source.forEach((value, key) => {
    const normalized = key.toLowerCase();
    if (
      HOP_BY_HOP_HEADERS.has(normalized) ||
      connectionHeaders.has(normalized) ||
      (options.request && normalized === "host") ||
      normalized === "set-cookie"
    ) {
      return;
    }
    result.append(key, value);
  });

  return result;
}

/**
 * Review PR #25 vòng 2 (contract với lane backend): item trước dùng
 * `request.ip` để tự gắn thêm IP client — nhưng Next.js 14.2.20 KHÔNG điền
 * `request.ip` cho App Router Route Handler chạy `runtime = "nodejs"` (route
 * này khai `export const runtime = "nodejs"` ở đầu file); trường đó chỉ có ở
 * Edge runtime hoặc nền tảng có cắm sẵn (Vercel). Nên `clientIp` luôn
 * `undefined` ở đây, và bản trước đó khi `undefined` sẽ chủ động XOÁ
 * `x-forwarded-for` — kể cả khi Next đã tự có sẵn giá trị đúng.
 *
 * Next tự đặt `x-forwarded-for ??= socket.remoteAddress` lên request thô
 * TRƯỚC khi request tới route handler (base-server.js:529 trong bản
 * 14.2.20 đang cài) — nghĩa là `request.headers.get("x-forwarded-for")` ở
 * đây ĐÃ mang giá trị đúng: chuỗi XFF client tự gửi (nếu có — Next append
 * IP của chính nó vào, không thay thế) hoặc địa chỉ socket ngay lập tức nếu
 * client không gửi gì. Việc của hop này chỉ là CHUYỂN TIẾP NGUYÊN GIÁ TRỊ
 * đó xuống backend — không xoá, không tự bịa thêm IP nào khác.
 *
 * Backend (#69 BLOCKER) chỉ tin header này khi TCP peer (chính Next server)
 * nằm trong TRUSTED_PROXIES — việc "attest" nằm ở phía backend (peer trust),
 * không phải ở hop Next này phải tự gắn thêm gì.
 */
export function resolveForwardedFor(request: NextRequest): string | undefined {
  return request.headers.get("x-forwarded-for") ?? undefined;
}

export function normalizeSetCookie(cookie: string, request: NextRequest): string {
  const isLocalHttp =
    request.nextUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(request.nextUrl.hostname);

  return cookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      const lower = part.toLowerCase();
      if (lower.startsWith("domain=")) return false;
      if (isLocalHttp && lower === "secure") return false;
      return true;
    })
    .map((part) => (isLocalHttp && part.toLowerCase() === "samesite=none" ? "SameSite=Lax" : part))
    .join("; ");
}

export async function proxyRequest(request: NextRequest, path: string[]) {
  const backendUrl = resolveBackendUrl(request);
  const encodedPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  const targetUrl = `${backendUrl}/api/${encodedPath}${request.nextUrl.search}`;
  const requestHeaders = copyEndToEndHeaders(request.headers, { request: true });
  const forwardedFor = resolveForwardedFor(request);
  if (forwardedFor) {
    requestHeaders.set("x-forwarded-for", forwardedFor);
  } else {
    requestHeaders.delete("x-forwarded-for");
  }
  const requestBody =
    request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : undefined;

  try {
    const response = await axios.request<ArrayBuffer>({
      url: targetUrl,
      method: request.method,
      headers: Object.fromEntries(requestHeaders.entries()) as AxiosRequestHeaders,
      data: requestBody,
      responseType: "arraybuffer",
      timeout: BACKEND_TIMEOUT_MS,
      maxRedirects: 0,
      validateStatus: () => true,
    });

    const sourceResponseHeaders = new Headers();
    Object.entries(response.headers).forEach(([key, value]) => {
      if (!value || key.toLowerCase() === "set-cookie") return;
      if (Array.isArray(value)) {
        for (const item of value) sourceResponseHeaders.append(key, String(item));
      } else {
        sourceResponseHeaders.append(key, String(value));
      }
    });
    const responseHeaders = copyEndToEndHeaders(sourceResponseHeaders, { request: false });

    const setCookieHeader = response.headers["set-cookie"];
    const setCookies = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : typeof setCookieHeader === "string"
        ? [setCookieHeader]
        : [];
    for (const cookie of setCookies) {
      responseHeaders.append("set-cookie", normalizeSetCookie(cookie, request));
    }

    return new NextResponse(response.data, {
      status: response.status,
      statusText: response.statusText || undefined,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(PROXY_FAILURE, { status: 502 });
  }
}
