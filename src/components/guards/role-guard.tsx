"use client";

/**
 * Route-level role protection component
 * Usage: <RoleGuard roles={["SYSTEM_ADMIN"]}><AdminPage /></RoleGuard>
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import type { Permission } from "@/lib/permissions";
import { normalizeRole, AUTH_ROUTES } from "@/lib/routes";

interface RoleGuardProps {
  roles?: string[];
  permissions?: Permission[];
  permissionMode?: "any" | "all";
  redirectTo?: string;
  children: React.ReactNode;
}

export function RoleGuard({
  roles,
  permissions: requiredPerms,
  permissionMode = "any",
  redirectTo = "/login",
  children,
}: RoleGuardProps) {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, activeRole, permissions, isSwitchingRole } = useAuthStore();
  const normalizedRole = normalizeRole(activeRole);
  const normalizedAllowedRoles = roles?.map((role) => normalizeRole(role)).filter(Boolean) as string[] | undefined;
  const hasPermissionAccess = requiredPerms
    ? permissionMode === "any"
      ? requiredPerms.some((p) => permissions.includes(p))
      : requiredPerms.every((p) => permissions.includes(p))
    : true;

  useEffect(() => {
    if (!hasHydrated || isSwitchingRole) return;

    // Not authenticated → redirect to login
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    // Authenticated but no role selected → redirect to role selection
    if (!normalizedRole) {
      router.replace(AUTH_ROUTES.LOGIN_ROLE);
      return;
    }

    // Authenticated but unauthorized role -> redirect to 403 (forbidden)
    if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(normalizedRole)) {
      router.replace("/403");
      return;
    }

    // Authenticated but unauthorized permission -> redirect to 403
    if (!hasPermissionAccess) {
      router.replace("/403");
    }
  }, [
    hasHydrated,
    isSwitchingRole,
    isAuthenticated,
    normalizedRole,
    normalizedAllowedRoles,
    permissions,
    hasPermissionAccess,
    router,
    redirectTo,
  ]);

  // Don't render until hydration + access checks; skip checks while switching role
  if (!hasHydrated) return null;
  if (isSwitchingRole) return null;
  if (!isAuthenticated) return null;
  if (!normalizedRole) return null;
  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(normalizedRole)) return null;
  if (!hasPermissionAccess) return null;

  return <>{children}</>;
}
