/**
 * Permission management service
 */

import { api } from "@/lib/api-client";
import type { Permission, CreatePermissionData } from "@/types/permission";

/**
 * List all permissions.
 * GET /permissions
 */
async function getPermissions(): Promise<Permission[]> {
  const response = await api.get<{ message: string; data: { permissions: Permission[] } }>("/permissions");
  return response.data.data.permissions;
}

/**
 * Get a single permission by ID.
 * GET /permissions/:id
 */
async function getPermission(id: string): Promise<Permission> {
  const response = await api.get<{ message: string; data: Permission }>(`/permissions/${id}`);
  return response.data.data;
}

/**
 * Create a new permission.
 * POST /permissions
 */
async function createPermission(data: CreatePermissionData): Promise<Permission> {
  const response = await api.post<{ message: string; data: Permission }>("/permissions", data);
  return response.data.data;
}

export const permissionService = {
  getPermissions,
  getPermission,
  createPermission,
};
