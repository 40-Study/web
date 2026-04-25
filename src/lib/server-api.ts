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
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
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
