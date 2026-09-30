/**
 * API Bạn bè (plans/260930-groups-friends/contract-api.md §1). Chỉ STUDENT gọi được; vai khác nhận
 * 403 `FRIEND_ROLE_NOT_ALLOWED`. Mọi lỗi đi qua `businessRequest` để giữ `code` cho bảng thông báo tiếng Việt.
 */
import { businessRequest } from "./business-request";

export interface FriendUser {
  user_id: string;
  user_name: string;
  full_name?: string;
  avatar_url?: string;
}

export type RelationStatus = "NONE" | "FRIENDS" | "PENDING_OUT" | "PENDING_IN" | "BLOCKED_BY_ME" | "SELF";

export interface Paged {
  total_count: number;
  page: number;
  limit: number;
}

export interface FriendItem {
  friendship_id: string;
  user: FriendUser;
  since: string;
}

export interface FriendRequestItem {
  id: string;
  direction: "incoming" | "outgoing";
  user: FriendUser;
  created_at: string;
}

export interface BlockItem {
  user: FriendUser;
  created_at: string;
}

export interface SearchedUser extends FriendUser {
  relationship: RelationStatus;
}

export interface FriendSummary {
  friends_count: number;
  incoming_requests: number;
  outgoing_requests: number;
}

export interface RelationshipInfo {
  status: RelationStatus;
  request_id?: string;
}

export type RequestDirection = "incoming" | "outgoing";

export interface PageParams {
  page?: number;
  limit?: number;
}

/** Tên hiển thị: ưu tiên họ tên đầy đủ, rơi về tên đăng nhập. KHÔNG bao giờ dùng email/điện thoại. */
export function friendDisplayName(user: Pick<FriendUser, "user_name" | "full_name">): string {
  return user.full_name?.trim() || user.user_name;
}

export const friendService = {
  list: (params?: PageParams & { keyword?: string }) =>
    businessRequest<{ friends: FriendItem[] } & Paged>({ method: "GET", url: "/friends", params }),

  summary: () => businessRequest<FriendSummary>({ method: "GET", url: "/friends/summary" }),

  requests: (params: PageParams & { direction: RequestDirection }) =>
    businessRequest<{ requests: FriendRequestItem[] } & Paged>({ method: "GET", url: "/friends/requests", params }),

  /** `status: "ACCEPTED"` nghĩa là đối phương đã gửi cho mình từ trước nên hai bên thành bạn luôn. */
  sendRequest: (userId: string) =>
    businessRequest<{ id: string; status: "PENDING" | "ACCEPTED"; user: FriendUser }>({
      method: "POST",
      url: "/friends/requests",
      data: { user_id: userId },
    }),

  accept: (requestId: string) =>
    businessRequest<{ id: string; status: "ACCEPTED"; user: FriendUser }>({
      method: "POST",
      url: `/friends/requests/${requestId}/accept`,
    }),

  decline: (requestId: string) =>
    businessRequest<{ id: string; status: "DECLINED" }>({
      method: "POST",
      url: `/friends/requests/${requestId}/decline`,
    }),

  /** Người gửi huỷ lời mời của mình. */
  cancel: (requestId: string) =>
    businessRequest<null>({ method: "DELETE", url: `/friends/requests/${requestId}` }),

  unfriend: (userId: string) => businessRequest<null>({ method: "DELETE", url: `/friends/${userId}` }),

  /** Backend bắt `q` tối thiểu 3 ký tự; phía web chặn trước (xem `MIN_SEARCH_LENGTH`). */
  search: (q: string, limit = 20) =>
    businessRequest<{ users: SearchedUser[] }>({ method: "GET", url: "/friends/search", params: { q, limit } }),

  relationship: (userId: string) =>
    businessRequest<RelationshipInfo>({ method: "GET", url: `/friends/relationship/${userId}` }),

  blocks: (params?: PageParams) =>
    businessRequest<{ blocks: BlockItem[] } & Paged>({ method: "GET", url: "/friends/blocks", params }),

  block: (userId: string) =>
    businessRequest<null>({ method: "POST", url: "/friends/blocks", data: { user_id: userId } }),

  unblock: (userId: string) => businessRequest<null>({ method: "DELETE", url: `/friends/blocks/${userId}` }),
};
