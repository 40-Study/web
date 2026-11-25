import { ApiError } from "@/lib/errors";

/** Mã backend C14 (QA7-A02): tên vai trò hệ thống trùng hoặc thuộc tên dành riêng -> 409. */
export const ROLE_NAME_EXISTS_CODE = "ERR_ROLE_NAME_EXISTS";
export const ROLE_NAME_EXISTS_MESSAGE = "Tên vai trò đã tồn tại, hãy chọn tên khác.";

/**
 * Lỗi "tên vai trò đã tồn tại" của tạo/sửa vai trò hệ thống. Chịu được backend cũ (trước C14): nó trả 400 với
 * message thô "duplicated key not allowed" cho mọi lỗi trùng khoá, nên nhận diện thêm theo câu đó.
 */
export function isRoleNameTakenError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.code === ROLE_NAME_EXISTS_CODE) return true;
  return error.status === 400 && /duplicated key/i.test(error.message);
}
