import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
  type: "STUDY_GROUP" | "CLASS_GROUP" | "COURSE_GROUP" | "CUSTOM";
  privacy: "PUBLIC" | "PRIVATE" | "SECRET";
  max_members: number;
  member_count: number;
  created_by: string;
  my_role?: string;
  conversation?: { id: string };
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  user_id: string;
  user_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  status: string;
  nickname?: string;
  joined_at?: string;
}

export interface JoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  email: string;
  avatar_url?: string;
  message?: string;
  status: string;
  created_at: string;
}

export interface CreateGroupDTO {
  name: string;
  description?: string;
  type?: string;
  privacy?: string;
  max_members?: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const groupService = {
  list: (params?: { keyword?: string; privacy?: string; page?: number; limit?: number }) =>
    api.get<R<{ groups: Group[]; total_count: number }>>("/groups", { params }).then((r) => r.data.data),

  getBySlug: (slug: string) =>
    api.get<R<Group>>(`/groups/${slug}`).then((r) => r.data.data),

  create: (data: CreateGroupDTO) =>
    api.post<R<Group>>("/groups", data).then((r) => r.data.data),

  update: (id: string, data: Partial<CreateGroupDTO>) =>
    api.put<R<Group>>(`/groups/${id}`, data).then((r) => r.data.data),

  delete: (id: string) => api.delete(`/groups/${id}`).then((r) => r.data),

  // My groups
  getMyJoined: (params?: { page?: number; limit?: number }) =>
    api.get<R<{ groups: Group[]; total_count: number }>>("/groups/me/joined", { params }).then((r) => r.data.data),

  getMyOwned: (params?: { page?: number; limit?: number }) =>
    api.get<R<{ groups: Group[]; total_count: number }>>("/groups/me/owned", { params }).then((r) => r.data.data),

  // Membership
  join: (id: string, message?: string) =>
    api.post<R<unknown>>(`/groups/${id}/join`, { message }).then((r) => r.data.data),

  leave: (id: string) =>
    api.post(`/groups/${id}/leave`).then((r) => r.data),

  // Members
  listMembers: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<R<{ members: GroupMember[]; total_count: number }>>(`/groups/${id}/members`, { params }).then((r) => r.data.data),

  inviteMembers: (id: string, userIds: string[]) =>
    api.post(`/groups/${id}/members/invite`, { user_ids: userIds }).then((r) => r.data),

  updateMemberRole: (groupId: string, userId: string, role: string) =>
    api.put(`/groups/${groupId}/members/${userId}/role`, { role }).then((r) => r.data),

  removeMember: (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members/${userId}`).then((r) => r.data),

  banMember: (groupId: string, userId: string) =>
    api.post(`/groups/${groupId}/members/${userId}/ban`).then((r) => r.data),

  unbanMember: (groupId: string, userId: string) =>
    api.post(`/groups/${groupId}/members/${userId}/unban`).then((r) => r.data),

  // Join requests
  listJoinRequests: (id: string) =>
    api.get<R<{ requests: JoinRequest[]; total_count: number }>>(`/groups/${id}/requests`).then((r) => r.data.data),

  approveRequest: (groupId: string, requestId: string) =>
    api.post(`/groups/${groupId}/requests/${requestId}/approve`).then((r) => r.data),

  rejectRequest: (groupId: string, requestId: string, reason?: string) =>
    api.post(`/groups/${groupId}/requests/${requestId}/reject`, { reason }).then((r) => r.data),
};
