import type { AdminUserListItem } from "@/types/user";

/**
 * Nhãn trạng thái tài khoản cho trang admin users (QA vòng 2, G6 — N-04): trước đây badge hiện
 * "Active"/"Locked" tiếng Anh trong khi bộ lọc cùng trang ghi "Đang hoạt động"/"Đã khoá".
 * Dùng chung cho danh sách và trang chi tiết để hai nơi không lệch chữ.
 *
 * Q10-ADMIN-03: tài khoản do CHÍNH người dùng xoá (`self_deleted_at`) khác tài khoản bị admin khoá: trước đây cả hai
 * đều hiện "Đã khoá" và nút "Mở khoá" có thể âm thầm khôi phục tài khoản người dùng đã chủ động xoá.
 */
type UserStatusFields = Pick<AdminUserListItem, "is_active" | "self_deleted_at">;

export const SELF_DELETED_LABEL = "Đã tự xoá";
export const RESTORE_ACTION_LABEL = "Khôi phục tài khoản";

/** Chỉ đúng khi đang không hoạt động VÀ backend báo mốc tự xoá; bản backend cũ không gửi trường này => bị khoá. */
export function isSelfDeleted(user: UserStatusFields): boolean {
  return !user.is_active && !!user.self_deleted_at;
}

export function getUserStatusLabel(user: UserStatusFields): string {
  if (user.is_active) return "Đang hoạt động";
  return isSelfDeleted(user) ? SELF_DELETED_LABEL : "Đã khoá";
}

/** Màu badge: tự xoá là trạng thái trung tính (không phải sự cố/xử phạt), khoá là cảnh báo. */
export function getUserStatusVariant(user: UserStatusFields): "success" | "secondary" | "destructive" {
  if (user.is_active) return "success";
  return isSelfDeleted(user) ? "secondary" : "destructive";
}
