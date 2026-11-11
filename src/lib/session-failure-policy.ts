/**
 * Khi nào một lỗi lúc khôi phục phiên được phép XOÁ phiên (QA-B-01 / QA-C-02, 261110).
 *
 * Trước đây mọi lỗi trong bootstrap (/auth/me, /auth/my-roles, refresh-token) đều xoá phiên, kể cả
 * timeout 15s hay mất mạng — trong khi cookie vẫn hợp lệ. Người dùng bị đá về /login, và vì `user`
 * cache đã bị xoá nên lần tải sau cũng không thử lại (guard khách trong auth-session.ts).
 *
 * Quy tắc: CHỈ khi server trả lời dứt khoát "phiên không hợp lệ" (401/403 sau refresh, 4xx khác
 * của chính request) mới xoá. Không có response, timeout, 408, 429, 5xx: server chưa kết luận gì
 * về phiên → giữ phiên và thử lại.
 */

import axios from "axios";
import { ApiError, NetworkError, RateLimitError } from "./errors";

export type SessionFailureKind = "rejected" | "transient";

/** Status mà server chưa nói gì về tính hợp lệ của phiên: quá tải, chặn tạm, cổng hết giờ. */
function isTransientStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

/** Lỗi đã qua interceptor của api-client (NetworkError / ApiError và các lớp con). */
export function classifySessionBootstrapError(error: unknown): SessionFailureKind {
  if (error instanceof NetworkError) return "transient";
  if (error instanceof ApiError) return isTransientStatus(error.status) ? "transient" : "rejected";
  // Lỗi lạ (không phải lỗi HTTP): giữ hành vi cũ là coi như phiên hỏng, để một lỗi lập trình không
  // biến thành vòng "đang thử kết nối lại" không bao giờ dứt với thông báo sai sự thật.
  return "rejected";
}

/** Lỗi thô (axios) của POST /auth/refresh-token, trước khi interceptor chuẩn hoá. */
export function classifyRefreshFailure(error: unknown): SessionFailureKind {
  if (!axios.isAxiosError(error)) return "rejected";
  if (!error.response) return "transient"; // timeout, ERR_ABORTED, mất mạng
  return isTransientStatus(error.response.status) ? "transient" : "rejected";
}

/**
 * Khoảng chờ giữa các lần thử lại bootstrap. Có giới hạn: hết danh sách thì dừng, hiện "không kết
 * nối được" kèm nút thử lại, không dội request vào một backend đang quá tải.
 */
export const BOOTSTRAP_RETRY_DELAYS_MS = [2_000, 5_000, 10_000] as const;

/**
 * 429 (rate limit): refresh-token dùng chung bucket 5 lần/phút/IP với /auth/login (backend
 * `AuthRateLimiter`, cửa sổ 1 phút; account lockout cũng trả 429). Thử lại theo nhịp 2s/5s/10s khi
 * còn bị chặn chỉ đốt thêm quota, và người dùng không đăng nhập lại được. Nên chờ đúng `retry_after`
 * (giây, backend trả cả ở body lẫn header Retry-After) cộng 1s đệm, vì backend cắt TTL xuống số giây
 * nguyên nên con số đó có thể ngắn hơn thời gian bị chặn thật.
 *
 * Trần 60s = đúng một cửa sổ rate limit. Phải chờ lâu hơn (vd. tài khoản bị khoá do sai mật khẩu
 * nhiều lần) thì KHÔNG tự thử nữa: báo mất kết nối kèm nút Thử lại, để người dùng tự bấm.
 * 429 không kèm thời gian chờ thì coi như phải chờ trọn một cửa sổ.
 */
export const RATE_LIMIT_MAX_WAIT_MS = 60_000;
const RATE_LIMIT_BUFFER_MS = 1_000;

/**
 * `attempt` tính từ 0 (lần thử lại đầu tiên). null = dừng thử lại tự động (hết lượt, hoặc 429 đòi chờ
 * lâu hơn trần). Vẫn tối đa BOOTSTRAP_RETRY_DELAYS_MS.length lần thử lại, kể cả khi gặp 429.
 */
export function getBootstrapRetryDelay(attempt: number, error?: unknown): number | null {
  const backoff = BOOTSTRAP_RETRY_DELAYS_MS[attempt];
  if (backoff === undefined) return null;
  if (!(error instanceof RateLimitError)) return backoff;
  const waitMs = error.retryAfter ? error.retryAfter * 1_000 + RATE_LIMIT_BUFFER_MS : RATE_LIMIT_MAX_WAIT_MS;
  if (waitMs > RATE_LIMIT_MAX_WAIT_MS + RATE_LIMIT_BUFFER_MS) return null;
  return Math.max(backoff, waitMs);
}
