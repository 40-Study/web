/**
 * Parent invitation service - all invitation-related API calls
 */

import { api } from "@/lib/api-client";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface InviteParentDTO {
  email: string;
  relationship: "parent" | "guardian" | "grandparent";
  message?: string;
}

export interface InviteParentResponse {
  invitation_id: string;
  status: string;
  parent_exists: boolean;
  message: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  invitation_id?: string;
  student_name?: string;
  relationship?: string;
  has_account: boolean;
  email?: string;
}

export interface RespondInvitationDTO {
  action: "accept" | "reject";
}

export interface ParentInvitation {
  id: string;
  student_user_id: string;
  invitee_email: string;
  invitee_user_id?: string;
  relationship: string;
  status: string;
  expires_at: string;
  responded_at?: string;
  message?: string;
  created_at: string;
  student?: {
    id: string;
    user_name: string;
    full_name?: string;
    avatar_url?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════════════════════

export const invitationService = {
  /** Validate invitation token (public, no auth required) */
  validateToken: (token: string) =>
    api
      .get<{ message: string; data: ValidateTokenResponse }>(`/invitations/validate/${token}`)
      .then((r) => r.data.data),

  /** Respond to invitation (accept/reject) */
  respond: (invitationId: string, data: RespondInvitationDTO) =>
    api
      .post<{ message: string }>(`/invitations/${invitationId}/respond`, data)
      .then((r) => r.data),

  /** Send invitation (student invites parent) */
  invite: (data: InviteParentDTO) =>
    api
      .post<{ message: string; data: InviteParentResponse }>("/invitations/invite", data)
      .then((r) => r.data.data),

  /** Get pending invitations for current user (parent) */
  getPending: () =>
    api
      .get<{ message: string; data: ParentInvitation[] }>("/invitations/pending")
      .then((r) => r.data.data),

  /** Get sent invitations (student) */
  getSent: () =>
    api
      .get<{ message: string; data: ParentInvitation[] }>("/invitations/sent")
      .then((r) => r.data.data),

  /** Revoke invitation (student) */
  revoke: (invitationId: string) =>
    api
      .post<{ message: string }>(`/invitations/${invitationId}/revoke`)
      .then((r) => r.data),
};
