"use client";

/**
 * Declarative permission gate component
 * Usage: <Can permission={PERMISSIONS.MANAGE_USERS}><AdminPanel /></Can>
 */

import type { Permission } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth.store";

interface CanProps {
  permission: Permission | Permission[];
  mode?: "any" | "all";
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({
  permission,
  mode = "any",
  fallback = null,
  children,
}: CanProps) {
  const permissions = useAuthStore((s) => s.permissions);

  const perms = Array.isArray(permission) ? permission : [permission];

  const allowed =
    mode === "any"
      ? perms.some((p) => permissions.includes(p))
      : perms.every((p) => permissions.includes(p));

  return allowed ? <>{children}</> : <>{fallback}</>;
}
