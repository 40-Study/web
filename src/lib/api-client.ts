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
import { AUTH_ROLE_CHANGED_EVENT, type AuthRoleChangedDetail } from "./auth-events";

function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NODE_ENV === "production") {
    return "/api";
  }
  return "http://localhost:5000/api";
}

const API_BASE_URL = resolveApiBaseUrl();

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

type RefreshResponseBody = {
  data?: { role_changed?: boolean; active_role?: string };
};

async function doRefresh(): Promise<void> {
  // Gọi refresh — cookies tự gửi, backend set cookie mới
  const res = await axios.post<RefreshResponseBody>(
    `${API_BASE_URL}/auth/refresh-token`,
    {},
    { withCredentials: true, timeout: 10_000 }
  );

  // Phase 3 (contract mục C): admin duyệt hồ sơ giảng viên → access token cũ bị 401
  // ROLE_CHANGED, refresh vẫn thành công và trả role_changed + active_role mới. Phát event
  // NGAY TẠI ĐÂY (không phải sau `await refreshPromise`) để nhiều request 401 đồng thời dùng
  // chung 1 lần refresh chỉ phát đúng 1 event.
  const payload = res?.data?.data;
  if (payload?.role_changed === true && typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<AuthRoleChangedDetail>(AUTH_ROLE_CHANGED_EVENT, {
        detail: { activeRole: payload.active_role ?? null },
      })
    );
  }
}

// ─── Response interceptor: 401 → refresh → retry ───────────────────────────

type ErrorResponseBody = {
  code?: string;
  message?: string;
  /** Nhiều handler (auth/cart/review...) đặt CHI TIẾT lỗi thật ở đây, còn
   * `message` chỉ là nhãn chung chung ("Register failed", "Refresh token
   * failed"...) — xem internal/handler/auth_handler.go, cart_handler.go,
   * review_handler.go. order_handler.go dùng quy ước khác (chi tiết thẳng
   * trong `message`, không có field này). */
  error?: string;
  details?: Record<string, string[]>;
};

/**
 * Ưu tiên `error` (chi tiết thật) khi có, rơi về `message` khi không — tương
 * thích cả 2 quy ước backend đang dùng song song. Trước đây LUÔN đọc
 * `data?.message`, nên với auth/cart/review handler, mọi lỗi hiện ra chỉ là
 * nhãn chung chung tiếng Anh ("Register failed") thay vì lý do thật ("invalid
 * OTP, 4 attempts remaining") — phát hiện khi kiểm chứng lỗi OTP sai (260927).
 */
function extractErrorMessage(data: ErrorResponseBody | undefined, fallback: string): string {
  return data?.error || data?.message || fallback;
}

// Review PR #25 (item 3 — MAJOR): `error`/`message` từ backend CHỈ an toàn
// hiển thị thẳng cho người dùng khi lỗi là do CHÍNH request đó (4xx — sai
// input, thiếu quyền, không tồn tại…). Với 5xx (lỗi server) hoặc mất mạng,
// message backend trả về CÓ THỂ là lỗi kỹ thuật nội bộ (stack trace rút gọn,
// tên bảng SQL, panic message…) — không được lộ ra UI. Dùng đúng 1 thông báo
// chung tiếng Việt cho cả 2 trường hợp này.
const GENERIC_SERVER_ERROR_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại";

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ErrorResponseBody>) => {
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
        // Refresh thất bại — phát tín hiệu để bootstrap xóa session authority. Không tự
        // chuyển public route sang login; RoleGuard sẽ điều hướng khi surface cần bảo vệ.
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("auth-storage");
          } catch {
            /* ignore */
          }
          window.dispatchEvent(new Event("fortex:auth-session-expired"));
        }
        throw new AuthError(extractErrorMessage(data, "Authentication required"), data?.code);
      }
    }

    // Normalize errors
    switch (status) {
      case 401:
        throw new AuthError(extractErrorMessage(data, "Authentication required"), data?.code);
      case 403:
        throw new ForbiddenError(extractErrorMessage(data, "Insufficient permissions"));
      case 404:
        throw new NotFoundError(extractErrorMessage(data, "Resource not found"));
      case 422:
        throw new ValidationError(data?.details ?? {});
      case 429:
        throw new RateLimitError();
      default: {
        // 4xx chưa được case riêng ở trên (400, 405, 409, 410…) — vẫn là lỗi
        // do request, an toàn hiển thị chi tiết backend. 5xx (và mọi status
        // khác nằm ngoài dải 4xx) → CHỈ thông báo chung, không đọc data?.error
        // /data?.message (xem GENERIC_SERVER_ERROR_MESSAGE).
        const isClientError = status >= 400 && status < 500;
        throw new ApiError(
          status,
          data?.code ?? "UNKNOWN",
          isClientError
            ? extractErrorMessage(data, "Something went wrong")
            : GENERIC_SERVER_ERROR_MESSAGE
        );
      }
    }
  }
);

// ─── Convenience wrapper (unwrap response.data) ─────────────────────────────

export const apiClient = {
  get: <T>(url: string, config?: object) => api.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, data?: unknown, config?: object) =>
    api.post<T>(url, data, config).then((r) => r.data),
  put: <T>(url: string, data?: unknown, config?: object) =>
    api.put<T>(url, data, config).then((r) => r.data),
  patch: <T>(url: string, data?: unknown, config?: object) =>
    api.patch<T>(url, data, config).then((r) => r.data),
  delete: <T>(url: string, config?: object) => api.delete<T>(url, config).then((r) => r.data),
};
