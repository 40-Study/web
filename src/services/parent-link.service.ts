/**
 * Liên kết phụ huynh-học sinh do PHỤ HUYNH khởi xướng (QA vòng 2 lane E, quyết định Q4):
 * phụ huynh gửi yêu cầu theo email của con, con phải xác nhận thì phụ huynh mới xem được dữ liệu.
 * Backend: `backend/internal/router/parent_link_router.go` (prefix `/family`).
 * Chiều ngược lại (con mời phụ huynh) vẫn ở `invitation.service.ts`.
 */

import { api } from "@/lib/api-client";

export type LinkRelationship = "parent" | "guardian" | "grandparent";
export type LinkRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface LinkUser {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  email: string;
}

export interface ParentLinkRequest {
  id: string;
  status: LinkRequestStatus;
  relationship: LinkRelationship;
  message?: string;
  created_at: string;
  responded_at?: string;
  /** Có ở danh sách "đến" của học sinh. */
  parent?: LinkUser;
  /** Có ở danh sách "đã gửi" của phụ huynh. */
  student?: LinkUser;
}

export interface LinkedParent extends LinkUser {
  relationship: LinkRelationship;
  linked_at?: string;
}

export interface CreateLinkRequestDTO {
  student_email: string;
  relationship: LinkRelationship;
  message?: string;
}

type Envelope<T> = { message: string; data: T };

export const parentLinkService = {
  /** Phụ huynh gửi yêu cầu liên kết tới email học sinh. */
  create: (body: CreateLinkRequestDTO) =>
    api.post<Envelope<ParentLinkRequest>>("/family/link-requests", body).then((r) => r.data.data),

  /** Phụ huynh xem các yêu cầu đã gửi (mới nhất trước). */
  listSent: () =>
    api.get<Envelope<ParentLinkRequest[]>>("/family/link-requests/sent").then((r) => r.data.data ?? []),

  /** Phụ huynh rút yêu cầu đang chờ. */
  cancel: (requestId: string) =>
    api.post<{ message: string }>(`/family/link-requests/${requestId}/cancel`).then((r) => r.data),

  /** Học sinh xem yêu cầu đang chờ mình xác nhận. */
  listIncoming: () =>
    api.get<Envelope<ParentLinkRequest[]>>("/family/link-requests/incoming").then((r) => r.data.data ?? []),

  /** Học sinh xác nhận hoặc từ chối. */
  respond: (requestId: string, action: "accept" | "reject") =>
    api.post<{ message: string }>(`/family/link-requests/${requestId}/respond`, { action }).then((r) => r.data),

  /** Học sinh xem phụ huynh đang liên kết. */
  listLinkedParents: () =>
    api.get<Envelope<LinkedParent[]>>("/family/parents").then((r) => r.data.data ?? []),

  /** Phụ huynh huỷ liên kết với con. */
  unlinkChild: (childId: string) =>
    api.delete<{ message: string }>(`/family/children/${childId}`).then((r) => r.data),

  /** Học sinh huỷ liên kết với phụ huynh. */
  unlinkParent: (parentId: string) =>
    api.delete<{ message: string }>(`/family/parents/${parentId}`).then((r) => r.data),
};
