import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosRequestHeaders } from "axios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveBackendUrl(request: NextRequest): string {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  const hostHeader =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.hostname;
  const host = (hostHeader || "").toLowerCase();
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return "http://localhost:5000";
  }

  return "https://api.fortex.ai.vn";
}

async function proxyRequest(request: NextRequest, path: string[]) {
  const backendUrl = resolveBackendUrl(request);
  const targetUrl = `${backendUrl}/api/${path.join("/")}${request.nextUrl.search}`;

  // Forward headers (except host)
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers[key] = value;
    }
  });

  // Forward cookies
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

  const requestBody =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.arrayBuffer()
      : undefined;

  // Make request to backend
  const response = await axios.request<ArrayBuffer>({
    url: targetUrl,
    method: request.method,
    headers: headers as AxiosRequestHeaders,
    data: requestBody,
    responseType: "arraybuffer",
    maxRedirects: 0,
    validateStatus: () => true,
  });

  // Create response with backend data
  const responseHeaders = new Headers();
  Object.entries(response.headers).forEach(([key, value]) => {
    if (!value || key.toLowerCase() === "set-cookie") {
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        responseHeaders.append(key, item);
      }
      return;
    }
    responseHeaders.append(key, String(value));
  });

  const setCookieHeader = response.headers["set-cookie"];
  const setCookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : typeof setCookieHeader === "string"
      ? [setCookieHeader]
      : [];

  for (const cookie of setCookies) {
    // Strip Domain attribute so browser assigns to request origin (fortex.ai.vn)
    const cleanedCookie = cookie
      .split(";")
      .filter((part) => !part.trim().toLowerCase().startsWith("domain="))
      .join(";");
    responseHeaders.append("set-cookie", cleanedCookie);
  }

  return new NextResponse(response.data, {
    status: response.status,
    statusText: response.statusText || undefined,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path);
}
