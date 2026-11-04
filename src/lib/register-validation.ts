/**
 * Kiểm tra form đăng ký phía client, dùng chung cho trang `/register/form` và modal đăng ký ở header
 * (G-02, QA3 261104: modal từng không validate, trình duyệt hiện tooltip tiếng Anh). Chỉ chặn lỗi gõ nhầm;
 * email/tên đăng nhập đã tồn tại do backend quyết định.
 */
import { AUTH_CONFIG } from "@/lib/constants";
import { validateEmail } from "@/lib/email-validation";
import { validateUserName } from "@/lib/user-name";

export interface RegisterFormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type RegisterFieldErrors = Partial<Record<keyof RegisterFormData, string>>;

/** Chỉ gán key khi CÓ lỗi: caller đếm `Object.keys`, gán `undefined` cũng tính là lỗi (QA2 PG-C1). */
export function validateRegisterForm(data: RegisterFormData): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  if (!data.username.trim()) errors.username = "Vui lòng nhập tên đăng nhập";
  else {
    const usernameError = validateUserName(data.username);
    if (usernameError) errors.username = usernameError;
  }
  if (!data.lastName.trim()) errors.lastName = "Vui lòng nhập họ";
  if (!data.firstName.trim()) errors.firstName = "Vui lòng nhập tên";
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  if (data.password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.password = `Mật khẩu phải có ít nhất ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} ký tự`;
  }
  if (data.confirmPassword !== data.password) {
    errors.confirmPassword = "Mật khẩu không khớp";
  }
  return errors;
}
