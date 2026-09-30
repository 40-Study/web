/**
 * Ma trận quyền UI của trang nhóm (plans/260930-groups-friends/phase-03).
 *
 * Backend mới là nơi kiểm quyền thật; UI chỉ ẩn nút người xem không dùng được. Toàn bộ điều kiện
 * nằm ở đây (hàm thuần) để test được từng ô của ma trận mà không cần dựng component.
 *
 *   OWNER      tất cả (trừ "Rời nhóm": backend chặn, chưa có chuyển quyền chủ nhóm — Q11)
 *   ADMIN      đổi vai / gỡ / cấm / cài đặt (không với OWNER)
 *   MODERATOR  duyệt yêu cầu xin vào + mời
 *   MEMBER     xem
 */
import type { Group } from "@/services/group.service";

export type GroupRole = "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";

/** Nút hành động chính trong header nhóm; `null` = không có nút. */
export type PrimaryAction = "join" | "request" | "requested" | "leave" | null;

export type ManageSection = "requests" | "members" | "banned" | "settings";

export function isMember(group: Pick<Group, "my_role">): boolean {
  return !!group.my_role;
}

export function getPrimaryAction(group: Group): PrimaryAction {
  if (group.my_role) {
    // Chủ nhóm không rời được (backend chặn); chỉ còn cách xoá nhóm ở tab Quản lý.
    return group.my_role === "OWNER" ? null : "leave";
  }
  if (group.privacy === "PUBLIC") return "join";
  if (group.privacy === "PRIVATE") return group.my_join_request ? "requested" : "request";
  // SECRET với người ngoài: backend trả 404 nên không tới được đây; không hiện nút phòng khi lọt.
  return null;
}

const REVIEWER_ROLES: ReadonlyArray<string | undefined> = ["OWNER", "ADMIN", "MODERATOR"];
const ADMIN_ROLES: ReadonlyArray<string | undefined> = ["OWNER", "ADMIN"];

/** Duyệt yêu cầu xin vào và mời thành viên. */
export const canInvite = (role?: string) => REVIEWER_ROLES.includes(role);
export const canReviewRequests = canInvite;
/** Đổi vai, gỡ, cấm, xem danh sách bị cấm, sửa cài đặt. */
export const canAdminister = (role?: string) => ADMIN_ROLES.includes(role);
export const canDeleteGroup = (role?: string) => role === "OWNER";

/**
 * Người ngoài chỉ xem được danh sách thành viên của nhóm PUBLIC (Q10: PRIVATE/SECRET chỉ thành viên),
 * dù backend hiện còn cho đọc — UI không được là chỗ lộ tên/avatar học sinh.
 */
export function canSeeMembers(group: Pick<Group, "my_role" | "privacy">): boolean {
  return isMember(group) || group.privacy === "PUBLIC";
}

/** Chat nhóm chỉ thành viên thấy; backend cũng chỉ trả `conversation` cho thành viên. */
export function canSeeChat(group: Pick<Group, "my_role" | "conversation">): boolean {
  return isMember(group) && !!group.conversation?.id;
}

/** Các mục của tab Quản lý mà người xem được dùng; rỗng nghĩa là ẩn cả tab. */
export function getManageSections(group: Pick<Group, "my_role" | "privacy">): ManageSection[] {
  const role = group.my_role;
  const sections: ManageSection[] = [];
  // Nhóm PUBLIC vào thẳng, không có yêu cầu để duyệt.
  if (canReviewRequests(role) && group.privacy !== "PUBLIC") sections.push("requests");
  if (canAdminister(role)) sections.push("members", "banned", "settings");
  return sections;
}

/**
 * Được thao tác (đổi vai/gỡ/cấm) lên `target` hay không. Ẩn hành động lên chính mình và lên OWNER.
 * ADMIN chỉ thao tác được lên MODERATOR/MEMBER: backend hiện còn cho ADMIN gỡ/cấm ADMIN khác
 * (nợ đã ghi trong open-questions), UI không quảng bá lỗ hổng đó.
 */
export function canManageMember(
  actorRole: string | undefined,
  target: { role: string; user_id: string },
  actorUserId: string | undefined
): boolean {
  if (!actorUserId || target.user_id === actorUserId) return false;
  if (target.role === "OWNER") return false;
  if (actorRole === "OWNER") return true;
  if (actorRole === "ADMIN") return target.role !== "ADMIN";
  return false;
}

/** Vai có thể gán cho `target`: chỉ OWNER được phong ADMIN; bỏ vai hiện tại của người đó. */
export function assignableRoles(
  actorRole: string | undefined,
  target: { role: string; user_id: string },
  actorUserId: string | undefined
): GroupRole[] {
  if (!canManageMember(actorRole, target, actorUserId)) return [];
  const roles: GroupRole[] = actorRole === "OWNER" ? ["ADMIN", "MODERATOR", "MEMBER"] : ["MODERATOR", "MEMBER"];
  return roles.filter((r) => r !== target.role);
}
