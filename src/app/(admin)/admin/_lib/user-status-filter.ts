import type { AdminUserListItem, AdminUserStatusFilter } from "@/types/user";
import { isSelfDeleted } from "./user-status-label";

/**
 * Bộ lọc trạng thái của /admin/users (Q10 #147 L1). Backend chỉ có `status=active|locked` (= `is_active`), nên `locked` trả
 * CẢ tài khoản bị khoá lẫn tài khoản tự xoá. Web tách hai loại này ở phía trình duyệt, TRONG TRANG đang xem (cùng cách với
 * sắp xếp ở `user-sort.ts`), cho tới khi backend có bộ lọc `self_deleted` riêng.
 */
export type UserStatusFilterValue = "ALL" | AdminUserStatusFilter | "self-deleted";

/** Giá trị gửi lên API: "Đã tự xoá" cũng là tập con của `locked`. */
export function toApiStatus(filter: UserStatusFilterValue): AdminUserStatusFilter | undefined {
  if (filter === "ALL") return undefined;
  return filter === "self-deleted" ? "locked" : filter;
}

export function parseStatusFilter(raw: string | null): UserStatusFilterValue {
  return raw === "active" || raw === "locked" || raw === "self-deleted" ? raw : "ALL";
}

/** Hai bộ lọc `locked` / `self-deleted` được tách phía client (tổng số trang/người dùng vẫn là của server). */
export function isSplitClientSide(filter: UserStatusFilterValue): boolean {
  return filter === "locked" || filter === "self-deleted";
}

export function matchesStatusFilter(
  user: Pick<AdminUserListItem, "is_active" | "self_deleted_at">,
  filter: UserStatusFilterValue
): boolean {
  if (filter === "locked") return !isSelfDeleted(user);
  if (filter === "self-deleted") return isSelfDeleted(user);
  return true;
}
