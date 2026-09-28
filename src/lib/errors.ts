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

export class ForbiddenError extends ApiError {
  constructor(message = "Insufficient permissions") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends ApiError {
  constructor(details: Record<string, string[]>) {
    super(422, "VALIDATION_ERROR", "Validation failed", details);
    this.name = "ValidationError";
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
    super("Network connection lost. Please check your internet.");
    this.name = "NetworkError";
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    super(429, "RATE_LIMIT", `Too many requests. ${retryAfter ? `Retry after ${retryAfter}s` : ""}`);
    this.name = "RateLimitError";
  }
}
