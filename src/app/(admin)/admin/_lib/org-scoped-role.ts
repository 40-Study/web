/**
 * QA-C-15: vai hệ thống ORG_OWNER chỉ là "khuôn" — chủ tổ chức thật được gán trong TỪNG tổ chức
 * (user_organization_roles, quản lý ở /admin/organizations), không qua bảng gán vai hệ thống. Vì vậy
 * GET /system-roles/:id/users của ORG_OWNER luôn ra 0 dù hệ thống có chủ tổ chức, và gán vai hệ thống này cho ai
 * đó cũng không làm họ thành chủ của tổ chức nào. Các màn admin dùng hàm này để ghi chú thay vì hiện "0 người".
 */
const ORG_SCOPED_SYSTEM_ROLES = new Set(["ORG_OWNER"]);

export function isOrgScopedSystemRole(roleName: string | null | undefined): boolean {
  return !!roleName && ORG_SCOPED_SYSTEM_ROLES.has(roleName);
}

export const ORG_SCOPED_ROLE_BADGE = "Gán theo tổ chức";

export const ORG_SCOPED_ROLE_HINT =
  "Chủ tổ chức được gán trong từng tổ chức ở mục Quản lý tổ chức, nên số ở đây không phản ánh số chủ tổ chức thật.";

/** Nhãn số người của một vai hệ thống: "lỗi", "…", "N người", hoặc ghi chú cho vai gán theo tổ chức. */
export function roleUserCountLabel(role: { name: string; userCount: number | null; userCountError?: boolean }): string {
  if (isOrgScopedSystemRole(role.name)) return ORG_SCOPED_ROLE_BADGE;
  if (role.userCountError) return "lỗi";
  if (role.userCount === null) return "…";
  return `${role.userCount} người`;
}
