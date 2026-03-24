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
  const { isAuthenticated, activeRole, permissions } = useAuthStore();
  const normalizedRole = normalizeRole(activeRole);
  const normalizedAllowedRoles = roles?.map((role) => normalizeRole(role)).filter(Boolean) as string[] | undefined;

  useEffect(() => {
    // Not authenticated → redirect to login
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    // Check role access
    if (normalizedAllowedRoles && (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole))) {
      router.replace("/403");
      return;
    }

    // Check permission access
    if (requiredPerms) {
      const hasAccess =
        permissionMode === "any"
          ? requiredPerms.some((p) => permissions.includes(p))
          : requiredPerms.every((p) => permissions.includes(p));

      if (!hasAccess) {
        router.replace("/403");
      }
    }
  }, [isAuthenticated, normalizedRole, normalizedAllowedRoles, permissions, requiredPerms, permissionMode, router, redirectTo]);

  // Don't render until we verify access
  if (!isAuthenticated) return null;
  if (normalizedAllowedRoles && (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole))) return null;

  return <>{children}</>;
}
