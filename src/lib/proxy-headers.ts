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
 * Review PR #25 (item 4 — contract với lane backend): X-Forwarded-For gửi
 * xuống backend PHẢI là chuỗi XFF đến (nếu có) + IP client mà chính Next
 * (hop này) quan sát được qua `request.ip` — KHÔNG chuyển tiếp nguyên văn
 * XFF của client mà không gắn thêm quan sát của hop này, vì backend chỉ tin
 * header này khi TCP peer (chính Next server) thuộc TRUSTED_PROXIES; XFF thô
 * của client tự khai không được attest thì không có giá trị định danh.
 * `request.ip` không xác định được (self-host không có proxy đặt sẵn IP, môi
 * trường test, …) -> KHÔNG gửi header này xuống backend (kể cả khi client có
 * gửi XFF), tránh backend hiểu nhầm giá trị chưa được hop này xác nhận.
 */
export function resolveForwardedFor(request: NextRequest): string | undefined {
  const clientIp = request.ip;
  if (!clientIp) return undefined;

  const incomingXff = request.headers.get("x-forwarded-for");
  return incomingXff ? `${incomingXff}, ${clientIp}` : clientIp;
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
