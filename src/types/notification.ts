/**
 * Notification types matching backend notification object shape
 */

export type NotificationType =
  | "course_update"
  | "new_lesson"
  | "quiz_reminder"
  | "certificate_earned"
  | "payment_success"
  | "payment_failed"
  | "promotion"
  | "system"
  | "achievement"
  | "streak"
  | "point_earned";

export interface Notification {
  id: string;
  title: string;
  content: string;
  notification_type: NotificationType;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}
