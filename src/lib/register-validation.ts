/**
 * Kiểm tra form đăng ký phía client, dùng chung cho trang `/register/form` và modal đăng ký ở header
 * (G-02, QA3 261104: modal từng không validate, trình duyệt hiện tooltip tiếng Anh). Chỉ chặn lỗi gõ nhầm;
 * email/tên đăng nhập đã tồn tại do backend quyết định.
 */
import { validateEmail } from "@/lib/email-validation";
import { validateNewPassword } from "@/lib/password-policy";
import { isUsernameTakenError, USERNAME_TAKEN_MESSAGE, USER_NAME_RULE_MESSAGE, validateUserName } from "@/lib/user-name";
import { ApiError } from "@/lib/errors";

/** Họ và Tên mỗi ô tối đa 100 ký tự (gộp lại vẫn dưới giới hạn 255 của `full_name` ở backend). Q8-PG-07. */
export const NAME_PART_MAX_LENGTH = 100;

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
  else if (data.lastName.trim().length > NAME_PART_MAX_LENGTH) errors.lastName = `Họ tối đa ${NAME_PART_MAX_LENGTH} ký tự`;
  if (!data.firstName.trim()) errors.firstName = "Vui lòng nhập tên";
  else if (data.firstName.trim().length > NAME_PART_MAX_LENGTH) errors.firstName = `Tên tối đa ${NAME_PART_MAX_LENGTH} ký tự`;
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  // Q5-PG-12: ô trống nói "Vui lòng nhập ..." như mọi ô khác; câu chính sách dài chỉ dành cho mật khẩu đã gõ.
  const passwordError = data.password ? validateNewPassword(data.password) : "Vui lòng nhập mật khẩu";
  if (passwordError) errors.password = passwordError;
  if (data.confirmPassword !== data.password) {
    errors.confirmPassword = "Mật khẩu không khớp";
  }
  return errors;
}

/**
 * Câu tiếng Việt cho từng field mà backend có thể báo trong `errors[]` của 400 "Validation failed". Backend (cũ) gửi câu
 * tiếng Anh ("full_name must be at most 255 characters") nên KHÔNG bao giờ in câu của backend, chỉ dùng tên field (Q8-PG-07).
 */
const SERVER_FIELD_ERRORS: Record<string, { field: keyof RegisterFormData; message: string }> = {
  full_name: { field: "lastName", message: `Họ và tên không hợp lệ: mỗi ô tối đa ${NAME_PART_MAX_LENGTH} ký tự` },
  user_name: { field: "username", message: USER_NAME_RULE_MESSAGE },
  email: { field: "email", message: "Email không đúng định dạng (vd: ten@vidu.com)" },
  password: { field: "password", message: "Mật khẩu chưa đạt yêu cầu" },
  confirm_password: { field: "confirmPassword", message: "Mật khẩu không khớp" },
};

export interface RegisterServerError {
  /** Lỗi gắn vào từng ô (rỗng nếu lỗi không thuộc ô nào). */
  fieldErrors: RegisterFieldErrors;
  /** Câu chung dưới form; rỗng khi lỗi đã gắn vào ô, để không nói hai lần. */
  formError: string;
}

/**
 * Đưa lỗi của `POST /auth/register/request` về đúng ô nhập, dùng chung cho trang `/register/form` và modal (Q8-PG-02, PG-07):
 * tên đăng nhập trùng/dành riêng (409 `ERR_USERNAME_EXISTS`) hiện dưới ô Tên đăng nhập; 400 kèm `errors[{field}]` hiện dưới ô tương ứng.
 * Lỗi khác (email đã đăng ký, 429, 5xx...) giữ câu chung do `describeOther` dựng.
 */
export function mapRegisterServerError(error: unknown, describeOther: (error: unknown) => string): RegisterServerError {
  if (isUsernameTakenError(error)) return { fieldErrors: { username: USERNAME_TAKEN_MESSAGE }, formError: "" };
  if (error instanceof ApiError && error.status === 400) {
    const list = (error.responseBody as { errors?: unknown } | undefined)?.errors;
    const fieldErrors: RegisterFieldErrors = {};
    if (Array.isArray(list)) {
      for (const item of list) {
        const mapped = SERVER_FIELD_ERRORS[(item as { field?: string } | null)?.field ?? ""];
        if (mapped && !fieldErrors[mapped.field]) fieldErrors[mapped.field] = mapped.message;
      }
    }
    if (Object.keys(fieldErrors).length > 0) return { fieldErrors, formError: "" };
  }
  return { fieldErrors: {}, formError: describeOther(error) };
}
