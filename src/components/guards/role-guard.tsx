"use client";

/**
 * Route-level role protection component
 * Usage: <RoleGuard roles={["SYSTEM_ADMIN"]}><AdminPage /></RoleGuard>
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import type { Permission } from "@/lib/permissions";
import { normalizeRole } from "@/lib/routes";

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
  const { isAuthenticated, hasHydrated, activeRole, permissions } = useAuthStore();
  const normalizedRole = normalizeRole(activeRole);
  const normalizedAllowedRoles = roles?.map((role) => normalizeRole(role)).filter(Boolean) as string[] | undefined;
  const hasPermissionAccess = requiredPerms
    ? permissionMode === "any"
      ? requiredPerms.some((p) => permissions.includes(p))
      : requiredPerms.every((p) => permissions.includes(p))
    : true;

  useEffect(() => {
    if (!hasHydrated) return;

    // Not authenticated → redirect to login
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    // Authenticated but unauthorized role -> 404
    if (normalizedAllowedRoles && (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole))) {
      router.replace("/404");
      return;
    }

    // Authenticated but unauthorized permission -> 404
    if (!hasPermissionAccess) {
      router.replace("/404");
    }
  }, [
    hasHydrated,
    isAuthenticated,
    normalizedRole,
    normalizedAllowedRoles,
    permissions,
    hasPermissionAccess,
    router,
    redirectTo,
  ]);

  // Don't render until hydration + access checks
  if (!hasHydrated) return null;
  if (!isAuthenticated) return null;
  if (normalizedAllowedRoles && (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole))) return null;
  if (!hasPermissionAccess) return null;

  return <>{children}</>;
}
