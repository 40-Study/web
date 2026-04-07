import { useQuery, useMutation } from "@tanstack/react-query";
import { invitationService } from "@/services/invitation.service";

// ─── Query keys ────────────────────────────────────────────────────────────

export const invitationKeys = {
  all: ["invitations"] as const,
  validate: (token: string | null) => [...invitationKeys.all, "validate", token] as const,
  pending: () => [...invitationKeys.all, "pending"] as const,
  sent: () => [...invitationKeys.all, "sent"] as const,
};

// ─── Queries ───────────────────────────────────────────────────────────────

/** Validate an invitation token (public, no auth required) */
export function useValidateInvitationToken(token: string | null) {
  return useQuery({
    queryKey: invitationKeys.validate(token),
    queryFn: () => invitationService.validateToken(token!),
    enabled: !!token,
  });
}

/** Get pending invitations for current user (parent) */
export function usePendingInvitations() {
  return useQuery({
    queryKey: invitationKeys.pending(),
    queryFn: () => invitationService.getPending(),
  });
}

/** Get sent invitations (student) */
export function useSentInvitations() {
  return useQuery({
    queryKey: invitationKeys.sent(),
    queryFn: () => invitationService.getSent(),
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────

/** Respond to an invitation (accept/reject) */
export function useRespondInvitation() {
  return useMutation({
    mutationFn: ({ invitationId, action }: { invitationId: string; action: "accept" | "reject" }) =>
      invitationService.respond(invitationId, { action }),
  });
}

/** Send an invitation (student invites parent) */
export function useInviteParent() {
  return useMutation({
    mutationFn: invitationService.invite,
  });
}

/** Revoke an invitation (student) */
export function useRevokeInvitation() {
  return useMutation({
    mutationFn: (invitationId: string) => invitationService.revoke(invitationId),
  });
}
