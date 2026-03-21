/**
 * Role & Permission management service
 */

import { api } from "@/lib/api-client";

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  user_count?: number;
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
  organization_id?: string;
}

export const roleService = {
  // Org Roles - Backend uses /org-roles with organization_id in body
  listOrgRoles: (orgId: string) =>
    api.get<{ message: string; data: { roles: Role[] } }>("/org-roles", { params: { organization_id: orgId } })
      .then((r) => r.data.data.roles),

  createOrgRole: (orgId: string, data: CreateRoleDTO) =>
    api.post<{ message: string; data: Role }>("/org-roles", { ...data, organization_id: orgId })
      .then((r) => r.data.data),

  updateOrgRole: (orgId: string, roleId: string, data: Partial<CreateRoleDTO>) =>
    api.put<{ message: string; data: Role }>(`/org-roles/${roleId}`, { ...data, organization_id: orgId })
      .then((r) => r.data.data),

  deleteOrgRole: (orgId: string, roleId: string) =>
    api.delete<{ message: string }>(`/org-roles/${roleId}`).then((r) => r.data),

  // System Roles
  listSystemRoles: () =>
    api.get<{ message: string; data: { roles: Role[] } }>("/system-roles")
      .then((r) => r.data.data.roles),

  createSystemRole: (data: CreateRoleDTO) =>
    api.post<{ message: string; data: Role }>("/system-roles", data).then((r) => r.data.data),

  updateSystemRole: (roleId: string, data: Partial<CreateRoleDTO>) =>
    api.put<{ message: string; data: Role }>(`/system-roles/${roleId}`, data).then((r) => r.data.data),

  deleteSystemRole: (roleId: string) =>
    api.delete<{ message: string }>(`/system-roles/${roleId}`).then((r) => r.data),

  // Permissions
  listPermissions: () =>
    api.get<{ message: string; data: { permissions: Permission[] } }>("/permissions")
      .then((r) => r.data.data.permissions),

  // User Role Assignment - Backend uses different paths
  assignOrgRole: (userId: string, orgId: string, roleId: string) =>
    api.post<{ message: string }>(`/users/${userId}/org-roles`, { organization_id: orgId, role_id: roleId })
      .then((r) => r.data),

  revokeOrgRole: (userId: string, _orgId: string, roleId: string) =>
    api.delete<{ message: string }>(`/users/${userId}/org-roles/${roleId}`).then((r) => r.data),

  assignSystemRole: (userId: string, roleId: string) =>
    api.post<{ message: string }>(`/users/${userId}/system-roles`, { role_id: roleId }).then((r) => r.data),

  revokeSystemRole: (userId: string, roleId: string) =>
    api.delete<{ message: string }>(`/users/${userId}/system-roles/${roleId}`).then((r) => r.data),
};
