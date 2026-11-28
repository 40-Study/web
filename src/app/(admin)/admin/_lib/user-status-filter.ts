import type { AdminUserListItem, AdminUserStatusFilter } from "@/types/user";
import { isSelfDeleted } from "./user-status-label";

/**
 * Bộ lọc trạng thái của /admin/users. Giá trị trên URL/ô chọn là `self-deleted` (gạch nối, giữ link cũ của Q10), còn API nhận
 * `self_deleted` (Q11-ADMIN-03): backend lọc đúng tập tài khoản tự xoá và `locked` không còn gồm họ, nên số lượng và phân trang
 * là của server. Bộ lọc phía client bên dưới chỉ còn là lớp phòng thủ cho BACKEND CŨ (xem `userService.list`: 400 -> gửi `locked`).
 */
export type UserStatusFilterValue = "ALL" | Exclude<AdminUserStatusFilter, "self_deleted"> | "self-deleted";

/** Giá trị gửi lên API. */
export function toApiStatus(filter: UserStatusFilterValue): AdminUserStatusFilter | undefined {
  if (filter === "ALL") return undefined;
  return filter === "self-deleted" ? "self_deleted" : filter;
}

export function parseStatusFilter(raw: string | null): UserStatusFilterValue {
  return raw === "active" || raw === "locked" || raw === "self-deleted" ? raw : "ALL";
}

/** Hai bộ lọc `locked` / `self-deleted` vẫn được lọc lại phía client: vô hại với backend mới, cần cho backend cũ (tổng số trang/người dùng khi đó là của `locked`). */
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
