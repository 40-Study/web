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

export interface OrgMember {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  roles: string[];
  joined_at: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const organizationService = {
  /** POST /organizations */
  create: (data: CreateOrgDTO) =>
    api.post<R<Organization>>("/organizations", data).then((r) => r.data.data),

  /** GET /organizations */
  list: () =>
    api.get<R<Organization[]>>("/organizations").then((r) => r.data.data),

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
    api.get<R<OrgMember[]>>(`/organizations/${orgId}/members`).then((r) => r.data.data),

  /** GET /organizations/:orgId/roles/:roleId/users */
  getUsersByRole: (orgId: string, roleId: string) =>
    api
      .get<R<OrgMember[]>>(`/organizations/${orgId}/roles/${roleId}/users`)
      .then((r) => r.data.data),
};
