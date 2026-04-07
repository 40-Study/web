/**
 * System role management service (super-admin level)
 */

import { api } from "@/lib/api-client";
import type { SystemRole, CreateRoleData, UpdateRoleData } from "@/types/role";

/**
 * List all system roles.
 * GET /system-roles
 */
async function getSystemRoles(): Promise<SystemRole[]> {
  const response = await api.get<{ message: string; data: { roles: SystemRole[] } }>("/system-roles");
  return response.data.data.roles;
}

/**
 * Create a new system role.
 * POST /system-roles
 */
async function createSystemRole(data: CreateRoleData): Promise<SystemRole> {
  const response = await api.post<{ message: string; data: SystemRole }>("/system-roles", data);
  return response.data.data;
}

/**
 * Update an existing system role.
 * PUT /system-roles/:id
 */
async function updateSystemRole(id: string, data: UpdateRoleData): Promise<SystemRole> {
  const response = await api.put<{ message: string; data: SystemRole }>(`/system-roles/${id}`, data);
  return response.data.data;
}

/**
 * Delete a system role.
 * DELETE /system-roles/:id
 */
async function deleteSystemRole(id: string): Promise<void> {
  await api.delete(`/system-roles/${id}`);
}

export const systemRoleService = {
  getSystemRoles,
  createSystemRole,
  updateSystemRole,
  deleteSystemRole,
};
