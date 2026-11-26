/**
 * Kiểm tra email phía client với câu lỗi tiếng Việt, dùng cùng `noValidate` trên form để thay tooltip
 * tiếng Anh của trình duyệt ("Please include an '@'…") — PG-M3 / F-12 (QA2 261013), cùng cách form đăng ký.
 * Chỉ chặn lỗi gõ nhầm; email có tồn tại hay không do backend quyết định.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMAIL_REQUIRED_MESSAGE = "Vui lòng nhập email";
export const EMAIL_FORMAT_MESSAGE = "Email không đúng định dạng (vd: ten@vidu.com)";

/**
 * Q8-PG-01 (contract C18): một địa chỉ email = một tài khoản bất kể hoa/thường. Mọi chỗ web gửi email lên API xác thực
 * (đăng ký, gửi lại mã, đăng nhập, quên/đặt lại mật khẩu) đi qua hàm này để backend luôn nhận bản đã cắt khoảng trắng và
 * viết thường. Backend cũ phân biệt hoa/thường nên đăng nhập bằng "Parent1@demo.com" từng bị từ chối; bản đã chuẩn hoá
 * vẫn đúng với cả backend cũ vì email lưu trong DB là chữ thường.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Trả câu lỗi tiếng Việt, hoặc `undefined` khi email hợp lệ. */
export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return EMAIL_REQUIRED_MESSAGE;
  if (!EMAIL_PATTERN.test(email)) return EMAIL_FORMAT_MESSAGE;
  return undefined;
}
