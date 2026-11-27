/**
 * Xoá tài khoản (`DELETE /auth/me`). Backend chỉ đặt `is_active=false` rồi đăng xuất, không xoá dữ liệu, nên lời cảnh
 * báo không được nói "xoá vĩnh viễn" (Q8-T10). Giảng viên còn số dư ví hoặc yêu cầu rút đang chờ thì backend từ chối
 * bằng 409 `ERR_ACCOUNT_HAS_BALANCE` (hợp đồng C22); backend cũ không kiểm tra nên vẫn xoá được như trước.
 */
import { ApiError, NetworkError } from "./errors";
import { getErrorMessage } from "./error-messages";

export const ACCOUNT_HAS_BALANCE_CODE = "ERR_ACCOUNT_HAS_BALANCE";

export const ACCOUNT_DELETE_COMMON_WARNING =
  "Hành động này không thể tự hoàn tác. Tài khoản sẽ bị vô hiệu hoá và bạn bị đăng xuất ngay; muốn dùng lại bạn cần liên hệ quản trị viên.";

export const ACCOUNT_DELETE_TEACHER_WARNING =
  "Là giảng viên, bạn chỉ vô hiệu hoá được tài khoản khi số dư ví bằng 0 và không còn yêu cầu rút tiền đang chờ. Hãy rút hết số dư hoặc huỷ yêu cầu rút trước.";

/** Lỗi ở ô mật khẩu của hộp thoại xoá tài khoản (hiện dưới ô nhập, hộp thoại giữ nguyên). */
export const DELETE_PASSWORD_FIELD_MESSAGE = "Mật khẩu không đúng, vui lòng nhập lại";

const DELETE_FAILED_MESSAGE = "Xoá tài khoản thất bại, vui lòng kiểm tra lại mật khẩu";

/** Vai giảng viên (hệ thống hoặc trong tổ chức): có ví thu nhập nên bị chặn khi còn số dư. */
export function hasTeacherRole(roles: ReadonlyArray<{ role_name: string }>): boolean {
  return roles.some((r) => r.role_name === "TEACHER" || r.role_name === "ORG_TEACHER");
}

/**
 * Câu toast khi xoá tài khoản lỗi: lý do số dư/rút tiền nói rõ; lỗi máy chủ (5xx) hoặc mất mạng dùng câu chung đúng
 * sự thật (không đổ lỗi cho mật khẩu); mọi lỗi khác giữ câu "kiểm tra lại mật khẩu".
 */
export function deleteAccountErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === ACCOUNT_HAS_BALANCE_CODE) return getErrorMessage(error);
  if (error instanceof NetworkError || (error instanceof ApiError && error.status >= 500)) return getErrorMessage(error);
  return DELETE_FAILED_MESSAGE;
}

/**
 * Sai mật khẩu xác nhận: 400/401/403 không phải lý do số dư. Lỗi này gắn vào ô nhập (Q9-PG-05) nên hook không toast
 * thêm; 5xx, mất mạng, 429, 409 số dư vẫn do toast của hook báo.
 */
export function isDeleteAccountPasswordError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.code !== ACCOUNT_HAS_BALANCE_CODE &&
    (error.status === 400 || error.status === 401 || error.status === 403)
  );
}
