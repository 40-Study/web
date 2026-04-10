/**
 * Notification service — list, unread count, mark read, delete
 */

import { api } from "@/lib/api-client";
import type { NotificationListResponse, UnreadCountResponse } from "@/types/notification";

type ApiResponse<T> = { message: string; data: T };

export const notificationService = {
  /** GET /notifications — paginated list with unread count */
  list: (params?: { page?: number; page_size?: number }) =>
    api
      .get<ApiResponse<NotificationListResponse>>("/notifications", { params })
      .then((r) => r.data.data),

  /** GET /notifications/unread-count */
  getUnreadCount: () =>
    api
      .get<ApiResponse<UnreadCountResponse>>("/notifications/unread-count")
      .then((r) => r.data.data),

  /** PATCH /notifications/:id/read */
  markAsRead: (id: string) =>
    api
      .patch<ApiResponse<null>>(`/notifications/${id}/read`)
      .then((r) => r.data),

  /** PATCH /notifications/read-all */
  markAllAsRead: () =>
    api
      .patch<ApiResponse<null>>("/notifications/read-all")
      .then((r) => r.data),

  /** DELETE /notifications/:id */
  delete: (id: string) =>
    api
      .delete<ApiResponse<null>>(`/notifications/${id}`)
      .then((r) => r.data),

  // ─── Notification preferences ────────────────────────────────────────────

  /** GET /notifications/settings */
  getSettings: () =>
    api
      .get<ApiResponse<Record<string, boolean>>>("/notifications/settings")
      .then((r) => r.data.data),

  /** PUT /notifications/settings */
  updateSettings: (data: Record<string, boolean>) =>
    api
      .put<ApiResponse<Record<string, boolean>>>("/notifications/settings", data)
      .then((r) => r.data),
};
