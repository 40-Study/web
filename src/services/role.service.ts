/**
 * Role & Permission management service
 */

import { api } from "@/lib/api-client";

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  user_count: number;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
  permissions: string[];
}

export const roleService = {
  // Org Roles
  listOrgRoles: (orgId: string) =>
    api.get<{ roles: Role[] }>(`/organizations/${orgId}/roles`).then((r) => r.data),

  createOrgRole: (orgId: string, data: CreateRoleDTO) =>
    api.post<Role>(`/organizations/${orgId}/roles`, data).then((r) => r.data),

  updateOrgRole: (orgId: string, roleId: string, data: Partial<CreateRoleDTO>) =>
    api.put<Role>(`/organizations/${orgId}/roles/${roleId}`, data).then((r) => r.data),

  deleteOrgRole: (orgId: string, roleId: string) =>
    api.delete<void>(`/organizations/${orgId}/roles/${roleId}`).then((r) => r.data),

  // System Roles
  listSystemRoles: () =>
    api.get<{ roles: Role[] }>("/system-roles").then((r) => r.data),

  createSystemRole: (data: CreateRoleDTO) =>
    api.post<Role>("/system-roles", data).then((r) => r.data),

  updateSystemRole: (roleId: string, data: Partial<CreateRoleDTO>) =>
    api.put<Role>(`/system-roles/${roleId}`, data).then((r) => r.data),

  deleteSystemRole: (roleId: string) =>
    api.delete<void>(`/system-roles/${roleId}`).then((r) => r.data),

  // Permissions
  listPermissions: () =>
    api.get<{ permissions: Permission[] }>("/permissions").then((r) => r.data),

  // User Role Assignment
  assignOrgRole: (userId: string, orgId: string, roleId: string) =>
    api.post<void>(`/users/${userId}/org-roles`, { org_id: orgId, role_id: roleId }).then((r) => r.data),

  revokeOrgRole: (userId: string, orgId: string, roleId: string) =>
    api.delete<void>(`/users/${userId}/org-roles/${orgId}/${roleId}`).then((r) => r.data),

  assignSystemRole: (userId: string, roleId: string) =>
    api.post<void>(`/users/${userId}/system-roles`, { role_id: roleId }).then((r) => r.data),

  revokeSystemRole: (userId: string, roleId: string) =>
    api.delete<void>(`/users/${userId}/system-roles/${roleId}`).then((r) => r.data),
};
