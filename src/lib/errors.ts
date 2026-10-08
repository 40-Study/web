/**
 * Typed error classes for API error handling
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class AuthError extends ApiError {
  // Review đối kháng (plans/reports/review-260928-users-pr72-pr28.md, finding #5 MAJOR):
  // trước đây gán CỨNG code="AUTH_ERROR", bỏ qua data?.code thật mà backend trả (vd.
  // "ACCOUNT_LOCKED") — buộc nơi tiêu thụ phải so sánh nguyên văn chuỗi message tiếng Việt,
  // dễ vỡ nếu backend đổi câu chữ. Nhận `code` từ call site (api-client.ts đọc data?.code),
  // fallback "AUTH_ERROR" khi backend không trả code cụ thể.
  constructor(message = "Authentication required", code = "AUTH_ERROR") {
    super(401, code, message);
    this.name = "AuthError";
  }
}

/**
 * Tài khoản bị admin khoá — backend trả 401 với `code: "ACCOUNT_LOCKED"` (auth_middleware.go khi
 * khoá giữa phiên, auth_handler.go khi đăng nhập). Tiêu đề hiển thị là hằng tiếng Việt, KHÔNG lấy
 * từ `error.message`: `extractErrorMessage` ưu tiên field `error` của body, mà middleware trả
 * `error: "Please login again"` (tiếng Anh) — lấy message sẽ hiện tiêu đề tiếng Anh cho người dùng.
 */
export const ACCOUNT_LOCKED_CODE = "ACCOUNT_LOCKED";
export const ACCOUNT_LOCKED_TITLE = "Tài khoản đã bị khoá";

export function isAccountLockedError(error: unknown): error is AuthError {
  return error instanceof AuthError && error.code === ACCOUNT_LOCKED_CODE;
}

export class ForbiddenError extends ApiError {
  constructor(message = "Insufficient permissions") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends ApiError {
  /**
   * Nguyên body 422 của backend khi nó mang `code` nghiệp vụ (vd. COURSE_LESSON_NO_CONTENT kèm
   * `lessons: [{id,title}]`). Trước đây interceptor bỏ hết, chỉ giữ `details` — nên code/message/danh
   * sách bài của 422 gửi-duyệt không bao giờ tới được UI (QA 261008 T6).
   */
  public payload?: Record<string, unknown>;

  constructor(
    details: Record<string, string[]>,
    business?: { code: string; message: string; payload: Record<string, unknown> }
  ) {
    super(
      422,
      business?.code ?? "VALIDATION_ERROR",
      business?.message ?? "Validation failed",
      details
    );
    this.name = "ValidationError";
    this.payload = business?.payload;
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

export class NetworkError extends Error {
  constructor() {
    // Review PR #25 (item 3): mất mạng/timeout không có response từ backend
    // để đọc chi tiết — luôn dùng đúng 1 thông báo chung tiếng Việt, khớp với
    // nhánh 5xx trong api-client.ts's GENERIC_SERVER_ERROR_MESSAGE.
    super("Có lỗi xảy ra, vui lòng thử lại");
    this.name = "NetworkError";
  }
}

export class RateLimitError extends ApiError {
  /** Số giây phải đợi, đọc từ `retry_after` (body) hoặc header `Retry-After` của backend (C5). */
  public retryAfter?: number;

  constructor(retryAfter?: number) {
    super(
      429,
      "RATE_LIMIT",
      retryAfter
        ? `Bạn thao tác quá nhiều lần, vui lòng thử lại sau ${retryAfter} giây`
        : "Bạn thao tác quá nhiều lần, vui lòng đợi một chút rồi thử lại"
    );
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}
