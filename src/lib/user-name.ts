/**
 * Luật user_name DUY NHẤT của web, phản chiếu `utils.UserNamePattern` ở backend
 * (backend/internal/utils/username.go): chữ không dấu, số và dấu gạch dưới, 3-30 ký tự.
 * Cố ý KHÔNG cho '@' hay '.', nên địa chỉ email không bao giờ là user_name hợp lệ: user_name hiện công khai
 * (bảng xếp hạng, hồ sơ công khai). Đăng ký và sửa hồ sơ dùng chung hàm này (QA hồi quy 03/10: A-09, B-03).
 * Đổi luật ở đây thì phải đổi cả backend, và ngược lại.
 */
import { ApiError } from "@/lib/errors";

export const USER_NAME_PATTERN = /^[A-Za-z0-9_]+$/;
export const USER_NAME_MIN_LENGTH = 3;
export const USER_NAME_MAX_LENGTH = 30;

export const USER_NAME_RULE_MESSAGE =
  "Tên đăng nhập gồm 3-30 ký tự: chữ không dấu, số hoặc dấu gạch dưới (_). Không dùng @ hay email";

/** Mã backend trả (409) khi tên đăng nhập đã có người dùng (không phân biệt hoa/thường) hoặc thuộc danh sách tên dành riêng (C19). */
export const USERNAME_TAKEN_CODE = "ERR_USERNAME_EXISTS";

export const USERNAME_TAKEN_MESSAGE = "Tên đăng nhập đã được dùng hoặc không được phép dùng. Hãy chọn tên khác.";

export function isUsernameTakenError(error: unknown): boolean {
  return error instanceof ApiError && error.code === USERNAME_TAKEN_CODE;
}

/** null nếu hợp lệ, ngược lại là câu tiếng Việt để hiện dưới ô nhập. */
export function validateUserName(value: string): string | null {
  const ok =
    value.length >= USER_NAME_MIN_LENGTH &&
    value.length <= USER_NAME_MAX_LENGTH &&
    USER_NAME_PATTERN.test(value);
  return ok ? null : USER_NAME_RULE_MESSAGE;
}
