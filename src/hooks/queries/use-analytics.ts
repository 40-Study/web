/**
 * React Query hooks for analytics data
 */

import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analytics.service";

export const analyticsKeys = {
  all: ["analytics"] as const,
  livestream: (sessionId: string) => [...analyticsKeys.all, "livestream", sessionId] as const,
  assignment: (assignmentId: string) => [...analyticsKeys.all, "assignment", assignmentId] as const,
  participants: (sessionId: string) => [...analyticsKeys.all, "participants", sessionId] as const,
};

/** Session-level engagement analytics */
export function useLivestreamAnalytics(sessionId: string) {
  return useQuery({
    queryKey: analyticsKeys.livestream(sessionId),
    queryFn: () => analyticsService.getLivestreamAnalytics(sessionId),
    enabled: !!sessionId,
  });
}

/** Assignment performance statistics */
export function useAssignmentAnalytics(assignmentId: string) {
  return useQuery({
    queryKey: analyticsKeys.assignment(assignmentId),
    queryFn: () => analyticsService.getAssignmentAnalytics(assignmentId),
    enabled: !!assignmentId,
  });
}

/** Per-participant breakdown for a session */
export function useParticipantAnalytics(sessionId: string) {
  return useQuery({
    queryKey: analyticsKeys.participants(sessionId),
    queryFn: () => analyticsService.getParticipantAnalytics(sessionId),
    enabled: !!sessionId,
  });
}
