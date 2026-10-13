/**
 * Kiểm tra email phía client với câu lỗi tiếng Việt, dùng cùng `noValidate` trên form để thay tooltip
 * tiếng Anh của trình duyệt ("Please include an '@'…") — PG-M3 / F-12 (QA2 261013), cùng cách form đăng ký.
 * Chỉ chặn lỗi gõ nhầm; email có tồn tại hay không do backend quyết định.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMAIL_REQUIRED_MESSAGE = "Vui lòng nhập email";
export const EMAIL_FORMAT_MESSAGE = "Email không đúng định dạng (vd: ten@vidu.com)";

/** Trả câu lỗi tiếng Việt, hoặc `undefined` khi email hợp lệ. */
export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return EMAIL_REQUIRED_MESSAGE;
  if (!EMAIL_PATTERN.test(email)) return EMAIL_FORMAT_MESSAGE;
  return undefined;
}
