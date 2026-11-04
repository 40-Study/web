/**
 * Q3-05 / Q3-14 — quy vai trò tuỳ biến của tổ chức về 3 giao diện thật của sản phẩm (học viên, giảng viên, quản trị).
 *
 * Backend cho phép tổ chức tự tạo vai trò (vd `QA3_TEACHER`), nhưng web chỉ có khu vực cho các mã trong
 * `ROLE_HOME_ROUTES`. Mã lạ trước đây rơi về trang chủ học viên rồi bị `RoleGuard` đá sang /403 (ngõ cụt).
 * Chủ dự án chốt: chỉ có 3 giao diện, vai tuỳ biến KHÔNG là đích riêng — người giữ vai đó vào giao diện của
 * VAI HỆ THỐNG họ đang có. Danh sách "vai mà web có khu vực" đọc thẳng từ `ROLE_HOME_ROUTES` (không lặp mã vai).
 */

import { AUTH_ROUTES, ROLE_HOME_ROUTES, normalizeRole } from "./routes";

/** Hình tối thiểu của `UnifiedRole` (auth.service) — giữ lib không phụ thuộc tầng service. */
export interface RoleLike {
  type: "system" | "organization";
  role_name: string;
}

/**
 * Thứ tự ưu tiên khi quy vai tuỳ biến về vai hệ thống. Vai tuỳ biến là vai nhân sự của tổ chức nên ưu tiên
 * giao diện giảng viên; quản trị hệ thống xếp cuối để vai phạm vi tổ chức không bao giờ tự đẩy người dùng
 * vào /admin.
 */
const SYSTEM_ROLE_FALLBACK_ORDER = ["TEACHER", "STUDENT", "PARENT", "TEACHER_APPLICANT", "SYSTEM_ADMIN"] as const;

/** Vai mà "ứng viên giảng viên" trùng nghĩa — đã có thì không mời đăng ký làm giảng viên nữa (Q3-14). */
const TEACHER_EQUIVALENT_ROLES = ["TEACHER"] as const;

const APPLICANT_ROLE = "TEACHER_APPLICANT";

/** Web có khu vực (home route) cho mã vai này không. */
export function isAppRole(roleName?: string | null): boolean {
  const normalized = normalizeRole(roleName);
  return !!normalized && normalized in ROLE_HOME_ROUTES;
}

/** Vai có nên xuất hiện trong màn chọn vai trò / chuyển vai trò không: chỉ vai web có khu vực thật. */
export function isSelectableRole(role: RoleLike): boolean {
  return isAppRole(role.role_name);
}

/**
 * Quy mã vai (có thể là vai tuỳ biến của tổ chức) về mã vai hệ thống dùng để dựng giao diện.
 * Mã đã là vai web nhận biết thì giữ nguyên; mã lạ thì lấy vai hệ thống ưu tiên cao nhất trong `ownedRoles`.
 * Trả null khi không quy được (người dùng chỉ có vai tuỳ biến, không có vai hệ thống nào).
 */
export function mapOrgRoleToSystemRole(
  roleName: string | null | undefined,
  ownedRoles: readonly RoleLike[] = []
): string | null {
  const normalized = normalizeRole(roleName);
  if (!normalized) return null;
  if (isAppRole(normalized)) return normalized;

  const ownedSystem = new Set(
    ownedRoles.filter((r) => r.type === "system").map((r) => normalizeRole(r.role_name))
  );
  return SYSTEM_ROLE_FALLBACK_ORDER.find((name) => ownedSystem.has(name)) ?? null;
}

/**
 * Trang chủ thật của vai đang dùng. Không bao giờ trả /403: mã lạ được quy về vai hệ thống, và nếu vẫn
 * không quy được thì về màn chọn vai trò (`fallback`) để người dùng có đường đi tiếp.
 */
export function resolveHomeRoute(
  activeRole: string | null | undefined,
  ownedRoles: readonly RoleLike[] = [],
  fallback: string = AUTH_ROUTES.LOGIN_ROLE
): string {
  const systemRole = mapOrgRoleToSystemRole(activeRole, ownedRoles);
  return systemRole ? ROLE_HOME_ROUTES[systemRole] : fallback;
}

/**
 * Danh sách vai hệ thống có thể "thêm mới" ở /login/role. Ẩn ứng viên giảng viên khi người dùng đã có vai
 * giảng viên (hoặc tương đương): họ không cần đăng ký làm giảng viên lần nữa (Q3-14). Ngoài ra bỏ vai đã sở hữu.
 */
export function filterAddableSystemRoles<T extends { name: string }>(
  options: readonly T[],
  ownedRoles: readonly RoleLike[]
): T[] {
  const owned = new Set(ownedRoles.map((r) => normalizeRole(r.role_name)));
  const isTeacher = TEACHER_EQUIVALENT_ROLES.some((name) => owned.has(name));
  return options.filter((option) => {
    const name = normalizeRole(option.name);
    if (owned.has(name)) return false;
    return !(isTeacher && name === APPLICANT_ROLE);
  });
}
