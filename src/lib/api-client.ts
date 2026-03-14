/**
 * Axios API client with token refresh and error normalization
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

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api";

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Cookie-based refresh token
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token refresh state
let refreshPromise: Promise<string> | null = null;

/**
 * Get token from auth store (lazy import to avoid circular deps)
 */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.token || null;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Set token in auth store
 */
function setToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.state.token = token;
      localStorage.setItem("auth-storage", JSON.stringify(parsed));
    }
  } catch {
    // Ignore
  }
}

/**
 * Clear auth state
 */
function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth-storage");
  window.location.href = "/login";
}

/**
 * Refresh the access token
 */
async function refreshToken(): Promise<string> {
  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh-token`,
    {},
    { withCredentials: true }
  );
  const newToken = response.data.data.access_token;
  setToken(newToken);
  return newToken;
}

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: error normalization + token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string; message?: string; details?: Record<string, string[]> }>) => {
    // Network error
    if (!error.response) {
      throw new NetworkError();
    }

    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const { status, data } = error.response;

    // Handle 401: try refresh token
    if (status === 401 && !original._retry) {
      original._retry = true;

      try {
        // Deduplicate: all concurrent 401s share one refresh call
        if (!refreshPromise) {
          refreshPromise = refreshToken().finally(() => {
            refreshPromise = null;
          });
        }

        const newToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        // Refresh failed, clear auth and redirect
        clearAuth();
        throw new AuthError(data?.message);
      }
    }

    // Normalize other errors
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

// Legacy support: ApiClient class (deprecated, use api directly)
export const apiClient = {
  get: <T>(url: string, config?: object) => api.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, data?: unknown, config?: object) => api.post<T>(url, data, config).then((r) => r.data),
  put: <T>(url: string, data?: unknown, config?: object) => api.put<T>(url, data, config).then((r) => r.data),
  patch: <T>(url: string, data?: unknown, config?: object) => api.patch<T>(url, data, config).then((r) => r.data),
  delete: <T>(url: string, config?: object) => api.delete<T>(url, config).then((r) => r.data),
};
