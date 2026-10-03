/**
 * Analytics service — session and assignment analytics data
 *
 * QA hồi quy 03/10 (B-01): backend là nguồn sự thật cho tên trường
 * (backend/internal/dto/analyticsDTO.go). Trước đây kiểu ở đây khai các trường backend không hề
 * trả (join_timeline, total_participants, participants[]...) nên trang Thống kê đọc
 * `undefined.map` và sập khi nhập Session ID hợp lệ. Giữ đúng tên backend, không thêm trường tự bịa.
 */

import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

/** `dto.AnalyticsResponseDTO` */
export interface AnalyticsResponseDTO {
  session_id: string;
  peak_viewers: number;
  total_viewers: number;
  total_messages: number;
  avg_watch_time_secs: number;
}

/** `dto.AssignmentAnalyticsDTO` */
export interface AssignmentAnalyticsDTO {
  assignment_id: string;
  total_submissions: number;
  accepted_count: number;
  acceptance_rate: number;
  avg_execution_time: number;
  avg_memory_used: number;
  difficulty: string;
  success_rate_by_level: Record<string, number>;
}

/** `dto.ParticipantAnalyticsDTO` — tổng hợp theo vai trò, không có danh sách từng người. */
export interface ParticipantAnalyticsDTO {
  session_id: string;
  active_count: number;
  total_joined: number;
  by_role: Record<string, number>;
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

  /** GET /analytics/participants/:sessionId — participant counts by role */
  getParticipantAnalytics: (sessionId: string) =>
    api
      .get<ApiResponse<ParticipantAnalyticsDTO>>(`/analytics/participants/${sessionId}`)
      .then((r) => r.data.data),
};
