import { api } from "@/lib/api-client";
import { ForbiddenError } from "@/lib/errors";

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
  /** Chỉ có khi người xem chưa là thành viên và đang có yêu cầu xin vào chờ duyệt (contract §2). */
  my_join_request?: { id: string; status: "PENDING" };
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  user_id: string;
  user_name: string;
  /** Họ tên hiển thị (contract §2); thiếu thì rơi về `user_name`. */
  full_name?: string;
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
  full_name?: string;
  avatar_url?: string;
  message?: string;
  status: string;
  created_at: string;
}

export type GroupMemberStatus = "ACTIVE" | "BANNED";

export interface CreateGroupDTO {
  name: string;
  description?: string;
  type?: string;
  privacy?: string;
  max_members?: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

/** Mã lỗi backend trả khi người được mời không có quan hệ hợp lệ với người mời. */
export const GROUP_INVITE_NOT_ALLOWED = "GROUP_INVITE_NOT_ALLOWED";

export interface InviteMembersResult {
  invited: string[];
  rejected: { user_id: string; code: string }[];
}

/**
 * Kết quả mời đã chuẩn hoá cho cả 200 lẫn 403-kèm-danh-sách. llRejected = true khi backend trả 403
 * GROUP_INVITE_NOT_ALLOWED (không ai được mời và mọi lý do đều là NOT_ALLOWED): vẫn là kết quả có
 * danh sách từ chối để hiển thị, không phải lỗi mất dữ liệu.
 */
export interface InviteMembersResponse {
  message: string;
  data: InviteMembersResult;
  allRejected?: boolean;
}

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
  /** `status: "joined"` khi nhóm PUBLIC (vào luôn); nhóm PRIVATE chỉ tạo yêu cầu chờ duyệt. */
  join: (id: string, message?: string) =>
    api.post<R<{ status?: string }>>(`/groups/${id}/join`, { message }).then((r) => r.data.data),

  leave: (id: string) =>
    api.post(`/groups/${id}/leave`).then((r) => r.data),

  // Members
  /** `status=BANNED` chỉ OWNER/ADMIN xem được (contract §2); mặc định ACTIVE. */
  listMembers: (id: string, params?: { page?: number; limit?: number; status?: GroupMemberStatus }) =>
    api.get<R<{ members: GroupMember[]; total_count: number }>>(`/groups/${id}/members`, { params }).then((r) => r.data.data),

  /**
   * 200 kèm `rejected` khi mời được một phần; 403 GROUP_INVITE_NOT_ALLOWED khi không ai được mời.
   * Interceptor chung đổi mọi 403 thành ForbiddenError và BỎ body, làm mất danh sách `rejected`, nên
   * nhận riêng 403 ở đây (validateStatus) và chỉ ném lỗi khi body KHÔNG có danh sách (403 thường: không đủ quyền).
   */
  inviteMembers: async (id: string, userIds: string[]): Promise<InviteMembersResponse> => {
    const res = await api.post<
      | { message: string; data: InviteMembersResult }
      | { message?: string; error?: string; data?: Partial<InviteMembersResult> }
    >(`/groups/${id}/members/invite`, { user_ids: userIds }, { validateStatus: (s) => (s >= 200 && s < 300) || s === 403 });
    if (res.status !== 403) return res.data as InviteMembersResponse;

    const body = res.data as { message?: string; error?: string; data?: Partial<InviteMembersResult> };
    const rejected = body?.data?.rejected;
    if (Array.isArray(rejected)) {
      return { message: body.message ?? "", data: { invited: body.data?.invited ?? [], rejected }, allRejected: true };
    }
    throw new ForbiddenError(body?.error || body?.message || "Insufficient permissions");
  },

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
