/**
 * Permission checking utilities
 */

import type { Permission } from "./permissions";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Check if user has a specific permission
 */
export function hasPermission(permission: Permission): boolean {
  const { permissions } = useAuthStore.getState();
  return permissions.includes(permission);
}

/**
 * Check if user has ANY of the given permissions
 */
export function hasAnyPermission(...perms: Permission[]): boolean {
  const { permissions } = useAuthStore.getState();
  return perms.some((p) => permissions.includes(p));
}

/**
 * Check if user has ALL of the given permissions
 */
export function hasAllPermissions(...perms: Permission[]): boolean {
  const { permissions } = useAuthStore.getState();
  return perms.every((p) => permissions.includes(p));
}

/**
 * Check if user has a specific role
 */
export function hasRole(role: string): boolean {
  const { activeRole } = useAuthStore.getState();
  return activeRole === role;
}

/**
 * Check if user has ANY of the given roles
 */
export function hasAnyRole(...roles: string[]): boolean {
  const { activeRole } = useAuthStore.getState();
  return activeRole !== null && roles.includes(activeRole);
}
