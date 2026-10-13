/**
 * Sắp xếp bảng người dùng admin (ADM-L2, QA2 261013). Backend GET /users chưa có tham số sort (chỉ keyword/role/
 * status/page/limit), nên sắp xếp TRONG TRANG đang xem ở client; khi backend hỗ trợ thì đổi sang tham số query.
 */
import type { AdminUserListItem } from "@/types/user";

export type UserSortKey = "email" | "name" | "created_at" | "last_login_at";
export type SortDirection = "asc" | "desc";

function valueOf(user: AdminUserListItem, key: UserSortKey): string | number | null {
  switch (key) {
    case "email":
      return user.email.toLowerCase();
    case "name":
      return (user.full_name || user.user_name || "").toLowerCase();
    case "created_at":
      return user.created_at ? new Date(user.created_at).getTime() : null;
    case "last_login_at":
      return user.last_login_at ? new Date(user.last_login_at).getTime() : null;
  }
}

/** Trả bản sao đã sắp; giá trị trống (chưa từng đăng nhập) luôn xuống cuối dù tăng hay giảm. */
export function sortAdminUsers(
  users: AdminUserListItem[],
  key: UserSortKey | null,
  direction: SortDirection
): AdminUserListItem[] {
  if (!key) return users;
  const sign = direction === "asc" ? 1 : -1;
  return [...users].sort((a, b) => {
    const va = valueOf(a, key);
    const vb = valueOf(b, key);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    if (typeof va === "string" && typeof vb === "string") return sign * va.localeCompare(vb, "vi");
    return sign * (Number(va) - Number(vb));
  });
}

/** Bấm cùng cột: tăng -> giảm -> bỏ sắp xếp; cột mới bắt đầu ở giảm dần với ngày, tăng dần với chữ. */
export function nextSort(
  current: { key: UserSortKey | null; direction: SortDirection },
  key: UserSortKey
): { key: UserSortKey | null; direction: SortDirection } {
  const isDate = key === "created_at" || key === "last_login_at";
  if (current.key !== key) return { key, direction: isDate ? "desc" : "asc" };
  const first: SortDirection = isDate ? "desc" : "asc";
  if (current.direction === first) return { key, direction: first === "asc" ? "desc" : "asc" };
  return { key: null, direction: "asc" };
}
