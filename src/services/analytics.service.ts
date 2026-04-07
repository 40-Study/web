/**
 * Analytics service — session and assignment analytics data
 */

import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AnalyticsResponseDTO {
  session_id: string;
  total_participants: number;
  peak_participants: number;
  avg_watch_duration: number;
  total_messages: number;
  total_reactions: number;
  engagement_rate: number;
  join_timeline: Array<{ timestamp: string; count: number }>;
}

export interface AssignmentAnalyticsDTO {
  assignment_id: string;
  total_submissions: number;
  accepted_count: number;
  avg_score: number;
  avg_execution_time: number;
  language_distribution: Record<string, number>;
  difficulty_rating?: number;
  submission_timeline: Array<{ timestamp: string; count: number }>;
}

export interface ParticipantAnalyticsDTO {
  session_id: string;
  participants: Array<{
    user_id: string;
    user_name: string;
    full_name?: string;
    avatar_url?: string;
    join_time: string;
    leave_time?: string;
    duration_seconds: number;
    messages_sent: number;
    submissions_count: number;
  }>;
  total: number;
}

type ApiResponse<T> = { message: string; data: T };

// ─── Service ─────────────────────────────────────────────────────────────────

export const analyticsService = {
  /** GET /analytics/livestream/:sessionId — session-level analytics */
  getLivestreamAnalytics: (sessionId: string) =>
    api
      .get<ApiResponse<AnalyticsResponseDTO>>(`/analytics/livestream/${sessionId}`)
      .then((r) => r.data.data),

  /** GET /analytics/assignment/:assignmentId — assignment performance stats */
  getAssignmentAnalytics: (assignmentId: string) =>
    api
      .get<ApiResponse<AssignmentAnalyticsDTO>>(`/analytics/assignment/${assignmentId}`)
      .then((r) => r.data.data),

  /** GET /analytics/participants/:sessionId — per-participant breakdown */
  getParticipantAnalytics: (sessionId: string) =>
    api
      .get<ApiResponse<ParticipantAnalyticsDTO>>(`/analytics/participants/${sessionId}`)
      .then((r) => r.data.data),
};
