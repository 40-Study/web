import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { normalizeRole } from "@/lib/routes";
import { authService, type UnifiedRole, type UserResponseDto } from "@/services/auth.service";
import { roleService } from "@/services/role.service";
import { useAuthStore, type AuthUser, type SessionStatus } from "@/stores/auth.store";

export const AUTH_SESSION_EXPIRED_EVENT = "fortex:auth-session-expired";

const knownPermissions = new Set<string>(Object.values(PERMISSIONS));
let bootstrapPromise: Promise<SessionStatus> | null = null;

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

  const records =
    role.type === "organization"
      ? await roleService.getOrgRolePermissions(role.id)
      : await roleService.getSystemRolePermissions(role.id);

  return records
    .map((permission) => permission.name)
    .filter((permission): permission is Permission => knownPermissions.has(permission));
}

async function runBootstrap(): Promise<SessionStatus> {
  const store = useAuthStore.getState();
  const roleSelectionToken = store.restoreSessionToken();

  // A multi-role login token is not an authenticated application session. Keep it scoped
  // to the current tab so the role-selection page can finish the existing login flow.
  if (roleSelectionToken) {
    store.setSessionStatus("anonymous");
    return "anonymous";
  }

  const previousUnifiedRole = store.activeUnifiedRole;
  const previousRoleName = store.activeRole;
  store.setSessionStatus("checking");

  try {
    const user = await authService.getMe();
    const { roles } = await authService.getMyRoles();
    const activeUnifiedRole = resolveActiveRole(roles, previousUnifiedRole, previousRoleName);
    const permissions = await loadPermissionsForRole(activeUnifiedRole);

    store.applyServerSession({
      user: toAuthUser(user),
      roles,
      activeRole: activeUnifiedRole ? normalizeRole(activeUnifiedRole.role_name) : null,
      activeUnifiedRole,
      permissions,
    });
    return "authenticated";
  } catch {
    if (useAuthStore.getState().sessionToken) {
      useAuthStore.getState().setSessionStatus("anonymous");
      return "anonymous";
    }
    store.clearServerSession();
    return "anonymous";
  }
}

export async function bootstrapAuthSession(forceFresh = false): Promise<SessionStatus> {
  if (forceFresh && bootstrapPromise) {
    await bootstrapPromise;
  }
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().finally(() => {
      bootstrapPromise = null;
    });
  }
  return bootstrapPromise;
}
