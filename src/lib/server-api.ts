/**
 * Server-side API client for Next.js Server Components
 * Forwards cookies from the request for authentication
 */

import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
}

/**
 * Lỗi HTTP phía server, có mang theo status code.
 *
 * Trước đây `serverFetch` ném `Error` trần, nên tầng gọi KHÔNG thể phân biệt
 * "404 — tài nguyên không tồn tại" với "500 — backend hỏng" hay "mất kết nối".
 * Vì không phân biệt được nên các catch trong `server-fetchers/` phải nuốt mọi
 * lỗi, và lỗi hạ tầng bị hiển thị thành dữ liệu rỗng (xem I1 của
 * plans/reports/t1k-code-reviewer-260912-1056-web-pr15-remove-mockdata.md).
 * Có status rồi thì chỉ xử lý riêng đúng trường hợp 404, còn lại ném lên.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Server-side fetch with cookie forwarding
 */
export async function serverFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const { method = "GET", body, cache, next } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: cache ?? "no-store",
    next,
    credentials: "include",
  });

  if (!response.ok) {
    throw new HttpError(response.status, `API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data ?? data;
}

/**
 * Server-side API methods
 */
export const serverApi = {
  get: <T>(endpoint: string, options?: Omit<FetchOptions, "method" | "body">) =>
    serverFetch<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, "method">) =>
    serverFetch<T>(endpoint, { ...options, method: "POST", body }),
};
