/**
 * Typed error classes for API error handling
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>,
    /** Nguyên body của lỗi 4xx (vd. 409 sinh buổi kèm `skipped[]`); không có với 5xx. */
    public responseBody?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Mã ổn định backend trả (429) khi hết hạn mức mời phụ huynh trong ngày (Q10 #148 M1). */
export const INVITATION_DAILY_LIMIT_CODE = "ERR_INVITATION_DAILY_LIMIT";

/** Mã `code` của 400 "id sai định dạng" ở các handler đã chuẩn hoá (vd. user/order admin). */
export const INVALID_ID_CODE = "ERR_INVALID_ID";

/**
 * 400 "id sai định dạng" của một GET theo id: `code === ERR_INVALID_ID` (handler chuẩn hoá) hoặc body cũ không có code
 * `{"error":"invalid id"}` (assignment...). MỌI 400 khác (tham số truy vấn, validate) KHÔNG phải "không tìm thấy" (#134 L-3).
 */
export function isInvalidIdError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 400 &&
    (error.code === INVALID_ID_CODE || /invalid id/i.test(error.message))
  );
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

/**
 * Q9-PG-05: tài khoản tự vô hiệu hoá đăng nhập lại bị 401 `ERR_ACCOUNT_DELETED` (backend mới). Tách khỏi "bị khoá" (admin
 * khoá) để người dùng biết mình tự xoá chứ không phải bị quản trị viên chặn. Backend cũ vẫn trả `ACCOUNT_LOCKED`, nên
 * nhánh khoá cũ giữ nguyên. So theo `code`, không so câu chữ.
 */
export const ACCOUNT_DELETED_CODE = "ERR_ACCOUNT_DELETED";
export const ACCOUNT_DELETED_TITLE = "Tài khoản đã bị xoá";
export const ACCOUNT_DELETED_DESCRIPTION = "Liên hệ hỗ trợ nếu muốn khôi phục.";
export const ACCOUNT_DELETED_MESSAGE = `${ACCOUNT_DELETED_TITLE}. ${ACCOUNT_DELETED_DESCRIPTION}`;

export function isAccountDeletedError(error: unknown): boolean {
  return error instanceof ApiError && error.code === ACCOUNT_DELETED_CODE;
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
