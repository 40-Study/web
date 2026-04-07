/**
 * Parent notification service - send reminders to parents about student work
 * Endpoints: /parent-notifications
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type NotificationType =
  | "assignment_reminder"
  | "live_session_reminder"
  | "grade_published"
  | "attendance_report"
  | "custom";

export interface ParentNotification {
  id: string;
  student_id: string;
  parent_id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string; // assignment_id, session_id, etc.
  sent_via: ("email" | "push" | "sms")[];
  sent_at?: string;
  read_at?: string;
  created_at: string;
}

export interface SendReminderDTO {
  student_ids: string[];
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string;
  send_via?: ("email" | "push" | "sms")[];
}

export interface BulkAssignmentReminderDTO {
  assignment_id: string;
  student_ids: string[];
  message: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const parentNotificationService = {
  /** POST /parent-notifications/send - send notifications to parents */
  send: (dto: SendReminderDTO) =>
    api
      .post<R<{ sent_count: number; failed_count: number }>>("/parent-notifications/send", dto)
      .then((r) => r.data.data),

  /** POST /parent-notifications/assignment-reminder - send assignment reminders */
  sendAssignmentReminder: (dto: BulkAssignmentReminderDTO) =>
    api
      .post<R<{ sent_count: number; failed_count: number }>>(
        "/parent-notifications/assignment-reminder",
        dto
      )
      .then((r) => r.data.data),

  /** POST /parent-notifications/live-session-reminder - send live session reminders */
  sendLiveSessionReminder: (sessionId: string, studentIds?: string[]) =>
    api
      .post<R<{ sent_count: number }>>("/parent-notifications/live-session-reminder", {
        session_id: sessionId,
        student_ids: studentIds,
      })
      .then((r) => r.data.data),

  /** GET /parent-notifications/history - get notification history */
  getHistory: (params?: { student_id?: string; type?: NotificationType; page?: number }) =>
    api
      .get<R<{ notifications: ParentNotification[]; total: number }>>(
        "/parent-notifications/history",
        { params }
      )
      .then((r) => r.data.data),

  /** GET /parent-notifications/stats - get notification stats for teacher */
  getStats: () =>
    api
      .get<
        R<{
          total_sent: number;
          this_week: number;
          by_type: Record<NotificationType, number>;
        }>
      >("/parent-notifications/stats")
      .then((r) => r.data.data),
};
