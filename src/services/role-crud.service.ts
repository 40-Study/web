/**
 * Generic role CRUD service (org-level roles)
 */

import { api } from "@/lib/api-client";
import type { Role, CreateRoleData, UpdateRoleData } from "@/types/role";

/**
 * List all roles (optionally filtered by organization).
 * GET /roles
 */
async function getRoles(organizationId?: string): Promise<Role[]> {
  const params = organizationId ? { organization_id: organizationId } : undefined;
  const response = await api.get<{ message: string; data: { roles: Role[] } }>("/roles", { params });
  return response.data.data.roles;
}

/**
 * Get a single role by ID.
 * GET /roles/:id
 */
async function getRole(id: string): Promise<Role> {
  const response = await api.get<{ message: string; data: Role }>(`/roles/${id}`);
  return response.data.data;
}

/**
 * Create a new role.
 * POST /roles
 */
async function createRole(data: CreateRoleData): Promise<Role> {
  const response = await api.post<{ message: string; data: Role }>("/roles", data);
  return response.data.data;
}

/**
 * Update an existing role.
 * PUT /roles/:id
 */
async function updateRole(id: string, data: UpdateRoleData): Promise<Role> {
  const response = await api.put<{ message: string; data: Role }>(`/roles/${id}`, data);
  return response.data.data;
}

/**
 * Delete a role.
 * DELETE /roles/:id
 */
async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${id}`);
}

export const roleCrudService = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
};
