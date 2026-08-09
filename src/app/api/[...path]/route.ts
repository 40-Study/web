import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosRequestHeaders } from "axios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

type RouteContext = { params: { path: string[] } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  return proxyRequest(request, params.path);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  return proxyRequest(request, params.path);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  return proxyRequest(request, params.path);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return proxyRequest(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return proxyRequest(request, params.path);
}

export async function OPTIONS(request: NextRequest, { params }: RouteContext) {
  return proxyRequest(request, params.path);
}
