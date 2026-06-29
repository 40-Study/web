/**
 * Role service — org roles, system roles, and user role assignment
 * Endpoints: /org-roles, /system-roles, /users/:userId/org-roles, /users/:userId/system-roles
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OrgRole {
  id: string;
  name: string;
  organization_id: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface SystemRole {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

export interface CreateOrgRoleDTO {
  name: string;
  organization_id: string;
  description?: string;
}

export interface CreateSystemRoleDTO {
  name: string;
  description?: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const roleService = {
  // ═══ Org Roles CRUD ═══════════════════════════════════════════════════════

  /** POST /org-roles */
  createOrgRole: (data: CreateOrgRoleDTO) =>
    api.post<R<OrgRole>>("/org-roles", data).then((r) => r.data.data),

  /** GET /org-roles */
  listOrgRoles: () =>
    api.get<R<OrgRole[]>>("/org-roles").then((r) => r.data.data),

  /** GET /org-roles/:roleId */
  getOrgRole: (roleId: string) =>
    api.get<R<OrgRole>>(`/org-roles/${roleId}`).then((r) => r.data.data),

  /** PUT /org-roles/:roleId */
  updateOrgRole: (roleId: string, data: { name?: string; description?: string }) =>
    api.put<R<OrgRole>>(`/org-roles/${roleId}`, data).then((r) => r.data.data),

  /** DELETE /org-roles/:roleId */
  deleteOrgRole: (roleId: string) =>
    api.delete<R<null>>(`/org-roles/${roleId}`).then((r) => r.data),

  /** PATCH /org-roles/:roleId/restore */
  restoreOrgRole: (roleId: string) =>
    api.patch<R<OrgRole>>(`/org-roles/${roleId}/restore`).then((r) => r.data.data),

  // Org Role Permissions
  /** GET /org-roles/:roleId/permissions */
  getOrgRolePermissions: (roleId: string) =>
    api.get<R<Permission[]>>(`/org-roles/${roleId}/permissions`).then((r) => r.data.data),

  /** POST /org-roles/:roleId/permissions — add permissions */
  addOrgRolePermissions: (roleId: string, permissionIds: string[]) =>
    api
      .post<R<null>>(`/org-roles/${roleId}/permissions`, { permission_ids: permissionIds })
      .then((r) => r.data),

  /** PUT /org-roles/:roleId/permissions — replace all permissions */
  setOrgRolePermissions: (roleId: string, permissionIds: string[]) =>
    api
      .put<R<null>>(`/org-roles/${roleId}/permissions`, { permission_ids: permissionIds })
      .then((r) => r.data),

  /** DELETE /org-roles/:roleId/permissions — remove permissions */
  removeOrgRolePermissions: (roleId: string, permissionIds: string[]) =>
    api
      .delete<R<null>>(`/org-roles/${roleId}/permissions`, {
        data: { permission_ids: permissionIds },
      })
      .then((r) => r.data),

  /** GET /org-roles/:roleId/users */
  getOrgRoleUsers: (roleId: string) =>
    api.get<R<unknown[]>>(`/org-roles/${roleId}/users`).then((r) => r.data.data),

  // ═══ System Roles CRUD ════════════════════════════════════════════════════

  /** POST /system-roles */
  createSystemRole: (data: CreateSystemRoleDTO) =>
    api.post<R<SystemRole>>("/system-roles", data).then((r) => r.data.data),

  /** GET /system-roles */
  listSystemRoles: () =>
    api.get<R<{ roles: SystemRole[] }>>("/system-roles").then((r) => r.data.data.roles),

  /** GET /system-roles/:id */
  getSystemRole: (id: string) =>
    api.get<R<SystemRole>>(`/system-roles/${id}`).then((r) => r.data.data),

  /** PUT /system-roles/:id */
  updateSystemRole: (id: string, data: { name?: string; description?: string }) =>
    api.put<R<SystemRole>>(`/system-roles/${id}`, data).then((r) => r.data.data),

  /** DELETE /system-roles/:id */
  deleteSystemRole: (id: string) =>
    api.delete<R<null>>(`/system-roles/${id}`).then((r) => r.data),

  /** PATCH /system-roles/:id/restore */
  restoreSystemRole: (id: string) =>
    api.patch<R<SystemRole>>(`/system-roles/${id}/restore`).then((r) => r.data.data),

  // System Role Permissions
  /** GET /system-roles/:id/permissions */
  getSystemRolePermissions: (id: string) =>
    api.get<R<Permission[]>>(`/system-roles/${id}/permissions`).then((r) => r.data.data),

  /** POST /system-roles/:id/permissions */
  addSystemRolePermissions: (id: string, permissionIds: string[]) =>
    api
      .post<R<null>>(`/system-roles/${id}/permissions`, { permission_ids: permissionIds })
      .then((r) => r.data),

  /** PUT /system-roles/:id/permissions — replace all */
  setSystemRolePermissions: (id: string, permissionIds: string[]) =>
    api
      .put<R<null>>(`/system-roles/${id}/permissions`, { permission_ids: permissionIds })
      .then((r) => r.data),

  /** DELETE /system-roles/:id/permissions */
  removeSystemRolePermissions: (id: string, permissionIds: string[]) =>
    api
      .delete<R<null>>(`/system-roles/${id}/permissions`, {
        data: { permission_ids: permissionIds },
      })
      .then((r) => r.data),

  /** GET /system-roles/:id/users */
  getSystemRoleUsers: (id: string) =>
    api.get<R<unknown[]>>(`/system-roles/${id}/users`).then((r) => r.data.data),

  // ═══ User Org Roles ═══════════════════════════════════════════════════════

  /** GET /users/:userId/org-roles */
  getUserOrgRoles: (userId: string) =>
    api.get<R<OrgRole[]>>(`/users/${userId}/org-roles`).then((r) => r.data.data),

  /** POST /users/:userId/org-roles */
  assignOrgRoles: (userId: string, data: { role_ids: string[]; organization_id: string; notes?: string }) =>
    api.post<R<null>>(`/users/${userId}/org-roles`, data).then((r) => r.data),

  /** DELETE /users/:userId/org-roles/:orgRoleId */
  revokeOrgRole: (userId: string, orgRoleId: string) =>
    api.delete<R<null>>(`/users/${userId}/org-roles/${orgRoleId}`).then((r) => r.data),

  // ═══ User System Roles ════════════════════════════════════════════════════

  /** GET /me/system-roles */
  getMySystemRoles: () =>
    api.get<R<SystemRole[]>>("/me/system-roles").then((r) => r.data.data),

  /** GET /users/:userId/system-roles */
  getUserSystemRoles: (userId: string) =>
    api.get<R<SystemRole[]>>(`/users/${userId}/system-roles`).then((r) => r.data.data),

  /** POST /users/:userId/system-roles */
  assignSystemRoles: (userId: string, data: { system_role_ids: string[]; notes?: string }) =>
    api.post<R<null>>(`/users/${userId}/system-roles`, data).then((r) => r.data),

  /** DELETE /users/:userId/system-roles/:systemRoleId */
  revokeSystemRole: (userId: string, systemRoleId: string) =>
    api.delete<R<null>>(`/users/${userId}/system-roles/${systemRoleId}`).then((r) => r.data),
};
