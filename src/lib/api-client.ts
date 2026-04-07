/**
 * Custom Axios client
 *
 * - access_token + refresh_token: httpOnly cookies, backend set, browser tự gửi
 * - Frontend KHÔNG lưu/đọc token — chỉ cần withCredentials: true
 * - 401 → gọi /auth/refresh-token (cookie tự gửi) → retry request gốc
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  ApiError,
  AuthError,
  ForbiddenError,
  ValidationError,
  NetworkError,
  RateLimitError,
  NotFoundError,
} from "./errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ─── Axios instance ─────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Browser tự gửi cookies mọi request
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Refresh logic (deduplicate concurrent 401s) ────────────────────────────

let refreshPromise: Promise<void> | null = null;
let isRefreshing = false;

async function doRefresh(): Promise<void> {
  // Gọi refresh — cookies tự gửi, backend set cookie mới
  await axios.post(
    `${API_BASE_URL}/auth/refresh-token`,
    {},
    { withCredentials: true, timeout: 10_000 }
  );
}

// ─── Response interceptor: 401 → refresh → retry ───────────────────────────

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ code?: string; message?: string; details?: Record<string, string[]> }>) => {
    if (!error.response) throw new NetworkError();

    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const { status, data } = error.response;

    // 401 → thử refresh 1 lần
    if (status === 401 && !original._retry) {
      original._retry = true;

      try {
        // Deduplicate: nhiều request 401 cùng lúc chỉ gọi refresh 1 lần
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = doRefresh().finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
        }

        await refreshPromise;

        // Refresh thành công — retry request gốc (cookies mới đã được set)
        return api(original);
      } catch {
        // Refresh thất bại — session hết hạn, về login
        if (typeof window !== "undefined") {
          // Clear UI state
          try { localStorage.removeItem("auth-storage"); } catch { /* ignore */ }
          window.location.href = "/login";
        }
        throw new AuthError(data?.message);
      }
    }

    // Normalize errors
    switch (status) {
      case 401:
        throw new AuthError(data?.message);
      case 403:
        throw new ForbiddenError(data?.message);
      case 404:
        throw new NotFoundError(data?.message);
      case 422:
        throw new ValidationError(data?.details ?? {});
      case 429:
        throw new RateLimitError();
      default:
        throw new ApiError(
          status,
          data?.code ?? "UNKNOWN",
          data?.message ?? "Something went wrong"
        );
    }
  }
);

// ─── Convenience wrapper (unwrap response.data) ─────────────────────────────

export const apiClient = {
  get: <T>(url: string, config?: object) => api.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, data?: unknown, config?: object) => api.post<T>(url, data, config).then((r) => r.data),
  put: <T>(url: string, data?: unknown, config?: object) => api.put<T>(url, data, config).then((r) => r.data),
  patch: <T>(url: string, data?: unknown, config?: object) => api.patch<T>(url, data, config).then((r) => r.data),
  delete: <T>(url: string, config?: object) => api.delete<T>(url, config).then((r) => r.data),
};
