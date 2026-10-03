/**
 * Organization service
 * Endpoints: /organizations
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  description?: string;
  code?: string;
  logo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrgDTO {
  name: string;
  description?: string;
}

export interface UpdateOrgDTO {
  name?: string;
  description?: string;
}

/** Lớp thuộc tổ chức (một dòng danh sách). */
export interface OrgClass {
  id: string;
  name: string;
  description?: string;
  status: string;
  course_id?: string;
  max_students?: number;
  teacher_count: number;
  student_count: number;
  created_at?: string;
}

/** Một dòng thành viên = một lần gán vai trò tổ chức (user_organization_roles); một người có thể có nhiều dòng. */
export interface OrgMemberRow {
  id: string;
  user_id: string;
  role_id: string;
  status: string;
  granted_at?: string;
  user?: { id: string; user_name: string; full_name?: string; email: string; avatar_url?: string };
  role?: { id: string; name: string };
}

/** Thành viên đã gộp theo người, để hiện tên/email và tất cả vai trò đang giữ. */
export interface OrgMember {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  roles: string[];
  granted_at?: string;
}

/** Gộp các dòng gán vai trò thành từng người; chỉ tính vai trò đang active. */
export function groupOrgMembers(rows: OrgMemberRow[]): OrgMember[] {
  const byUser = new Map<string, OrgMember>();
  for (const row of rows) {
    if (row.status !== "active") continue;
    const existing = byUser.get(row.user_id);
    const roleName = row.role?.name;
    if (existing) {
      if (roleName && !existing.roles.includes(roleName)) existing.roles.push(roleName);
      continue;
    }
    byUser.set(row.user_id, {
      user_id: row.user_id,
      name: row.user?.full_name?.trim() || row.user?.user_name || "Người dùng không rõ",
      email: row.user?.email ?? "",
      avatar_url: row.user?.avatar_url,
      roles: roleName ? [roleName] : [],
      granted_at: row.granted_at,
    });
  }
  return Array.from(byUser.values());
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const organizationService = {
  /** POST /organizations */
  create: (data: CreateOrgDTO) =>
    api.post<R<Organization>>("/organizations", data).then((r) => r.data.data),

  /** GET /organizations */
  list: () =>
    api.get<R<{ organizations: Organization[] }>>("/organizations").then((r) => r.data.data.organizations),

  /** GET /organizations/:orgId */
  getById: (orgId: string) =>
    api.get<R<Organization>>(`/organizations/${orgId}`).then((r) => r.data.data),

  /** PUT /organizations/:orgId */
  update: (orgId: string, data: UpdateOrgDTO) =>
    api.put<R<Organization>>(`/organizations/${orgId}`, data).then((r) => r.data.data),

  /** DELETE /organizations/:orgId */
  delete: (orgId: string) =>
    api.delete<R<null>>(`/organizations/${orgId}`).then((r) => r.data),

  /** GET /organizations/:orgId/members */
  getMembers: (orgId: string) =>
    api
      .get<R<{ user_organization_roles: OrgMemberRow[]; total: number }>>(`/organizations/${orgId}/members`, {
        params: { page: 1, page_size: 100, status: "active" },
      })
      .then((r) => groupOrgMembers(r.data.data.user_organization_roles)),

  /** GET /organizations/:orgId/classes — lớp thuộc tổ chức (chủ/quản trị tổ chức). */
  getClasses: (orgId: string, params: { page?: number; page_size?: number; keyword?: string; status?: string } = {}) =>
    api
      .get<R<{ classes: OrgClass[]; total: number; page: number; page_size: number }>>(
        `/organizations/${orgId}/classes`,
        { params: { page: 1, page_size: 20, ...params } }
      )
      .then((r) => r.data.data),
};
