/**
 * Rút câu lỗi từ body lỗi của backend. Tách khỏi `api-client.ts` để `services/business-request.ts` dùng CHUNG đúng quy tắc
 * này (Q6 #133 R1) mà không kéo cả axios instance (nhiều test mock `@/lib/api-client` chỉ với `api`).
 */

export type ErrorResponseBody = {
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
export function extractErrorMessage(data: ErrorResponseBody | undefined, fallback: string): string {
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
