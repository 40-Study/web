/**
 * Notification service — list, unread count, mark read, delete, admin broadcast
 */

import { api } from "@/lib/api-client";
import { ApiError } from "@/lib/errors";
import { GENERIC_ERROR_MESSAGE } from "@/lib/error-messages";
import type { NotificationListResponse, UnreadCountResponse } from "@/types/notification";

type ApiResponse<T> = { message: string; data: T };

// ─── Admin broadcast (contract C3, plans/261008-qa-followup-features/contract.md) ───

export type BroadcastAudience = "all" | "roles";
export type BroadcastNotificationType = "system" | "promotion";

/** POST /admin/notifications/broadcast/preview */
export interface BroadcastPreviewRequest {
  audience: BroadcastAudience;
  roles?: string[];
}

export interface BroadcastPreview {
  recipient_count: number;
}

/** POST /admin/notifications/broadcast — notification_type bỏ trống = "system" (title <=255, content <=2000). */
export interface BroadcastRequest extends BroadcastPreviewRequest {
  title: string;
  content: string;
  notification_type?: BroadcastNotificationType;
}

export interface BroadcastResult {
  recipient_count: number;
  audience: BroadcastAudience;
  roles: string[];
  notification_type: BroadcastNotificationType;
}

export const BROADCAST_PARTIAL_CODE = "BROADCAST_PARTIAL";

/**
 * Đợt gửi lỗi giữa chừng: `delivered` người ĐÃ nhận (thông báo không thu hồi được nên admin không được gửi
 * lại toàn bộ). api-client thay message của mọi 5xx bằng câu chung và bỏ body, nên số này chỉ tới được UI qua
 * `sendBroadcast` (đọc thẳng body 500 có code BROADCAST_PARTIAL).
 */
export class BroadcastPartialError extends ApiError {
  constructor(public delivered: number) {
    super(500, BROADCAST_PARTIAL_CODE, GENERIC_ERROR_MESSAGE);
    this.name = "BroadcastPartialError";
  }
}

type BroadcastFailureBody = { code?: string; delivered?: unknown };

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

  // ─── Admin broadcast ─────────────────────────────────────────────────────

  /** POST /admin/notifications/broadcast/preview — số người sẽ nhận, không gửi gì */
  previewBroadcast: (body: BroadcastPreviewRequest) =>
    api
      .post<ApiResponse<BroadcastPreview>>("/admin/notifications/broadcast/preview", body)
      .then((r) => r.data.data),

  /**
   * POST /admin/notifications/broadcast — gửi thật (201). 500 được cho qua validateStatus để đọc số người đã
   * nhận khi lỗi giữa chừng; mọi 4xx vẫn đi qua interceptor của api-client như thường.
   */
  sendBroadcast: async (body: BroadcastRequest): Promise<BroadcastResult> => {
    const res = await api.post<ApiResponse<BroadcastResult> | BroadcastFailureBody>(
      "/admin/notifications/broadcast",
      body,
      { validateStatus: (status) => (status >= 200 && status < 300) || status === 500 }
    );
    if (res.status === 500) {
      const failure = res.data as BroadcastFailureBody;
      if (failure?.code === BROADCAST_PARTIAL_CODE && typeof failure.delivered === "number") {
        throw new BroadcastPartialError(failure.delivered);
      }
      throw new ApiError(500, failure?.code ?? "UNKNOWN", GENERIC_ERROR_MESSAGE);
    }
    return (res.data as ApiResponse<BroadcastResult>).data;
  },
};
