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
import { useAuthStore } from "@/stores/auth.store";

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

// ─── Khi nào 401 KHÔNG được gọi refresh (C2, QA khách 260928) ───────────────
//
// `/auth/refresh-token` dùng chung bucket rate-limit 5 lần/phút/IP với `/auth/login`. Trước đây
// MỌI 401 đều gọi refresh, nên gõ sai mật khẩu tốn 2 lượt (login 401 + refresh 400) và người dùng
// bị 429 ngay lần thứ 4. Hai trường hợp refresh chắc chắn vô ích:
//  1. Request tự nó là bước xác thực (gửi mật khẩu / OTP / token): 401 nghĩa là thông tin sai,
//     không phải access token hết hạn. KHÔNG gồm /auth/me, /auth/my-roles... (cần refresh để khôi
//     phục phiên), nên so khớp CHÍNH XÁC đường dẫn, không dùng tiền tố "/auth/".
//     CỐ Ý KHÔNG gồm /auth/logout và /auth/logout-all: backend đặt chúng SAU AuthMiddleware, nên
//     401 ở đây đúng là access token hết hạn (15 phút). Bỏ refresh thì logout thất bại, refresh
//     token (cookie `rfToken`, sống 7 ngày) không bị thu hồi và người dùng sau trên máy dùng chung
//     vào lại được phiên cũ (review PR #33, BLOCKER).
//  2. Store đã biết phiên là `anonymous` (khách, hoặc refresh vừa thất bại): không có refresh
//     token hợp lệ để dùng. `checking` (bootstrap đang gọi /auth/me) vẫn được refresh.
const CREDENTIAL_AUTH_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/register/request",
  "/auth/refresh-token",
  "/auth/reset-password",
  "/auth/reset-password/request",
  "/auth/select-role",
]);

function normalizeRequestPath(url: string | undefined): string {
  if (!url) return "";
  // `url` của axios là tương đối theo baseURL ("/auth/login"), có thể kèm query string.
  const path = url.split("?")[0].replace(/^https?:\/\/[^/]+/, "").replace(/^\/api(?=\/)/, "");
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function shouldAttemptRefresh(url: string | undefined): boolean {
  if (CREDENTIAL_AUTH_PATHS.has(normalizeRequestPath(url))) return false;
  if (useAuthStore.getState().sessionStatus === "anonymous") return false;
  return true;
}

function readRetryAfterSeconds(
  data: ErrorResponseBody | undefined,
  headers: Record<string, unknown> | undefined
): number | undefined {
  const fromBody = Number(data?.retry_after);
  if (Number.isFinite(fromBody) && fromBody > 0) return Math.ceil(fromBody);
  const fromHeader = Number(headers?.["retry-after"]);
  if (Number.isFinite(fromHeader) && fromHeader > 0) return Math.ceil(fromHeader);
  return undefined;
}

// ─── Response interceptor: 401 → refresh → retry ───────────────────────────

type ErrorResponseBody = {
  code?: string;
  message?: string;
  /** Số giây phải đợi khi 429 (internal/middleware/rate_limiter.go, account_lockout.go). */
  retry_after?: number;
  /** Nhiều handler (auth/cart/review...) đặt CHI TIẾT lỗi thật ở đây, còn
   * `message` chỉ là nhãn chung chung ("Register failed", "Refresh token
   * failed"...) — xem internal/handler/auth_handler.go, cart_handler.go,
   * review_handler.go. order_handler.go dùng quy ước khác (chi tiết thẳng
   * trong `message`, không có field này). */
  error?: string;
  details?: Record<string, string[]>;
  /** Lỗi validate từng field của backend (utils.ValidateStruct): 400 `{message:"Validation failed", errors:[{field,tag,message}]}`. */
  errors?: unknown;
};

/**
 * Ưu tiên `error` (chi tiết thật) khi có, rơi về `message` khi không — tương
 * thích cả 2 quy ước backend đang dùng song song. Trước đây LUÔN đọc
 * `data?.message`, nên với auth/cart/review handler, mọi lỗi hiện ra chỉ là
 * nhãn chung chung tiếng Anh ("Register failed") thay vì lý do thật ("invalid
 * OTP, 4 attempts remaining") — phát hiện khi kiểm chứng lỗi OTP sai (260927).
 */
function extractErrorMessage(data: ErrorResponseBody | undefined, fallback: string): string {
  return data?.error || firstFieldErrorMessage(data) || data?.message || fallback;
}

/**
 * Câu lỗi của field đầu tiên trong `errors[]` (400 validate). `message` của body chỉ là nhãn chung
 * "Validation failed" nên người dùng không biết sai chỗ nào (QA hồi quy A-09: sửa hồ sơ chỉ báo "Cập nhật thất
 * bại"). Tầng hiển thị (getErrorMessage) vẫn dịch/chặn câu tiếng Anh lạ về câu chung theo status.
 */
function firstFieldErrorMessage(data: ErrorResponseBody | undefined): string | undefined {
  if (!Array.isArray(data?.errors)) return undefined;
  for (const item of data.errors) {
    const msg = (item as { message?: unknown } | null)?.message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return undefined;
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
    const { status, data, headers } = error.response;

    // 401 → thử refresh 1 lần (trừ các trường hợp refresh vô ích, xem shouldAttemptRefresh)
    if (status === 401 && !original._retry && shouldAttemptRefresh(original.url)) {
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
        // 422 nghiệp vụ của backend luôn có `code` (COURSE_EMPTY, COURSE_LESSON_NO_CONTENT...):
        // giữ code/message/payload để nơi gọi dịch được. 422 không code = lỗi validate field như cũ.
        throw new ValidationError(
          data?.details ?? {},
          data?.code
            ? {
                code: data.code,
                message: extractErrorMessage(data, "Validation failed"),
                payload: data as Record<string, unknown>,
              }
            : undefined
        );
      case 429:
        throw new RateLimitError(
          readRetryAfterSeconds(data, headers as Record<string, unknown> | undefined)
        );
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
