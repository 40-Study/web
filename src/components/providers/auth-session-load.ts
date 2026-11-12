import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { normalizeRole } from "@/lib/routes";
import { authService, type UnifiedRole, type UserResponseDto } from "@/services/auth.service";
import type { AuthUser } from "@/stores/auth.store";

/**
 * Nạp phiên từ server (getMe + vai trò + quyền) cho bootstrap. Tách khỏi `auth-session.ts` để file
 * điều phối bootstrap (thử lại, huỷ lượt chờ, báo mất kết nối) không vượt 200 dòng.
 */

const knownPermissions = new Set<string>(Object.values(PERMISSIONS));

function toAuthUser(user: UserResponseDto): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.full_name || user.username || user.email,
    avatar: user.avatar_url,
  };
}

function isSameRoleAssignment(left: UnifiedRole, right: UnifiedRole): boolean {
  return (
    left.id === right.id &&
    left.type === right.type &&
    (left.organization_id ?? null) === (right.organization_id ?? null)
  );
}

export function resolveActiveRole(
  roles: UnifiedRole[],
  previousUnifiedRole: UnifiedRole | null,
  previousRoleName: string | null
): UnifiedRole | null {
  if (previousUnifiedRole) {
    const exactRole = roles.find((role) => isSameRoleAssignment(role, previousUnifiedRole));
    if (exactRole) return exactRole;
  }

  const normalizedPreviousRole = normalizeRole(previousRoleName);
  if (!normalizedPreviousRole) return null;

  const matchingRoles = roles.filter(
    (role) => normalizeRole(role.role_name) === normalizedPreviousRole
  );
  return matchingRoles.length === 1 ? matchingRoles[0] : null;
}

export async function loadPermissionsForRole(role: UnifiedRole | null): Promise<Permission[]> {
  if (!role) return [];

  const names = await authService.getMyPermissions();
  return names.filter((permission): permission is Permission => knownPermissions.has(permission));
}

export async function loadServerSession(
  previousUnifiedRole: UnifiedRole | null,
  previousRoleName: string | null
) {
  const user = await authService.getMe();
  const { roles } = await authService.getMyRoles();
  const activeUnifiedRole = resolveActiveRole(roles, previousUnifiedRole, previousRoleName);
  // Lỗi 2 (fullstack-verify-260922): trước đây lỗi nạp quyền rơi xuống catch bên dưới và xoá
  // phiên đã xác thực (getMe + getMyRoles đều 200), đẩy người dùng về trang chọn vai trò ngay
  // sau khi đăng nhập. Quyền chỉ dùng để ẩn/hiện UI (server vẫn tự kiểm), nên nạp hỏng thì giữ
  // phiên với quyền rỗng và ghi cảnh báo, không đăng xuất.
  let permissions: Permission[] = [];
  try {
    permissions = await loadPermissionsForRole(activeUnifiedRole);
  } catch (error) {
    console.warn("[auth] Không nạp được quyền của người dùng, tạm dùng quyền rỗng", error);
  }

  return {
    user: toAuthUser(user),
    roles,
    activeRole: activeUnifiedRole ? normalizeRole(activeUnifiedRole.role_name) : null,
    activeUnifiedRole,
    permissions,
  };
}
