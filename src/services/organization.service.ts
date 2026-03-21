/**
 * Organization management service
 */

import { api } from "@/lib/api-client";

export interface Organization {
  id: string;
  name: string;
  code: string;
  logo?: string;
  description?: string;
  created_at: string;
}

export interface CreateOrgDTO {
  name: string;
  code: string;
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

export const organizationService = {
  list: () =>
    api.get<{ message: string; data: { organizations: Organization[] } }>("/organizations")
      .then((r) => r.data.data.organizations),

  getById: (id: string) =>
    api.get<{ message: string; data: Organization }>(`/organizations/${id}`)
      .then((r) => r.data.data),

  create: (data: CreateOrgDTO) =>
    api.post<{ message: string; data: Organization }>("/organizations", data)
      .then((r) => r.data.data),

  update: (id: string, data: Partial<CreateOrgDTO>) =>
    api.put<{ message: string; data: Organization }>(`/organizations/${id}`, data)
      .then((r) => r.data.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/organizations/${id}`).then((r) => r.data),

  getMembers: (orgId: string) =>
    api.get<{ message: string; data: { members: OrgMember[] } }>(`/organizations/${orgId}/members`)
      .then((r) => r.data.data.members),
};
