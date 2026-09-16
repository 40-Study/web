/**
 * Livestream service — session management and controls
 * Endpoints: /livestream
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LivestreamSession {
  id: string;
  title: string;
  description?: string;
  host_id: string;
  class_id?: string;
  course_id?: string;
  lesson_content_id?: string;
  max_viewers?: number;
  is_recorded?: boolean;
  room_name?: string;
  status?: string;
  started_at?: string;
  ended_at?: string;
  scheduled_at?: string;
  created_at?: string;
  updated_at?: string;
  /**
   * Cờ cấu hình phiên (review vòng 2 web PR #18, C1) — `whiteboard_locked` là
   * NGUỒN SỰ THẬT phía server cho trạng thái khoá bảng, khớp
   * `model.LivestreamSettings` (`internal/model/livestream_session.go:56-63`).
   * Web đọc field này khi vào phòng để seed trạng thái ban đầu thay vì đợi một
   * gói LiveKit (LiveKit không echo lại gói tự gửi cho chính người gửi).
   */
  settings?: {
    whiteboard_locked?: boolean;
  };
}

/** Envelope thật của GET /livestream — không bọc {message,data} */
export interface LivestreamListResponse {
  data: LivestreamSession[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateLivestreamDTO {
  title: string;
  description?: string;
  host_id: string;
  max_viewers?: number;
  is_recorded?: boolean;
}

export interface UpdateLivestreamDTO {
  title?: string;
  description?: string;
  max_viewers?: number;
}

export interface Participant {
  user_id: string;
  user_name?: string;
  role?: string;
  joined_at?: string;
}

export interface ModerationAction {
  user_id: string;
  action: "mute" | "kick";
  reason?: string;
  duration?: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const livestreamService = {
  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** POST /livestream */
  create: (data: CreateLivestreamDTO) =>
    api.post<R<LivestreamSession>>("/livestream", data).then((r) => r.data.data),

  /**
   * GET /livestream — trả raw {data,total,page,page_size}, KHÔNG bọc {message,data}
   * như phần lớn API khác. Lọc theo host_id/status ở query; không hỗ trợ lọc
   * theo class_id/course_id trên backend nên phải lọc thêm ở client nếu cần.
   */
  list: (params?: { hostId?: string; status?: string; page?: number; pageSize?: number }) =>
    api
      .get<LivestreamListResponse>("/livestream", {
        params: {
          host_id: params?.hostId,
          status: params?.status,
          page: params?.page,
          page_size: params?.pageSize,
        },
      })
      .then((r) => r.data),

  /** @deprecated dùng {@link list} — giữ lại vì có thể còn nơi khác import, KHÔNG khớp response thật */
  getAll: () =>
    api.get<R<LivestreamSession[]>>("/livestream").then((r) => r.data.data),

  /** GET /livestream/:sessionId */
  getById: (sessionId: string) =>
    api.get<R<LivestreamSession>>(`/livestream/${sessionId}`).then((r) => r.data.data),

  /** PUT /livestream/:sessionId */
  update: (sessionId: string, data: UpdateLivestreamDTO) =>
    api.put<R<LivestreamSession>>(`/livestream/${sessionId}`, data).then((r) => r.data.data),

  /** DELETE /livestream/:sessionId */
  delete: (sessionId: string) =>
    api.delete<R<null>>(`/livestream/${sessionId}`).then((r) => r.data),

  // ── Session Controls ──────────────────────────────────────────────────────

  /** POST /livestream/:sessionId/start */
  start: (sessionId: string, roomName: string) =>
    api
      .post<R<LivestreamSession>>(`/livestream/${sessionId}/start`, { room_name: roomName })
      .then((r) => r.data.data),

  /** POST /livestream/:sessionId/end */
  end: (sessionId: string) =>
    api.post<R<null>>(`/livestream/${sessionId}/end`, {}).then((r) => r.data),

  // Đã xoá `join` (review vòng 2 web PR #18, §5 + I4): gửi `{user_id, role}`,
  // thiếu `name` là field BẮT BUỘC của `JoinLivestimeDTO` (backend) nên chắc
  // chắn 400 nếu được nối dây; 0 call site xác nhận bằng
  // `git grep -n "livestreamService\.join\b" src/` (rỗng). Luồng join thật
  // dùng `serverApi.post` trực tiếp trong
  // `app/(live)/rooms/[roomName]/join-livestream.ts`.

  /** POST /livestream/:sessionId/leave */
  leave: (sessionId: string, userId: string) =>
    api
      .post<R<null>>(`/livestream/${sessionId}/leave`, { user_id: userId })
      .then((r) => r.data),

  /** GET /livestream/:sessionId/participants */
  getParticipants: (sessionId: string) =>
    api
      .get<R<Participant[]>>(`/livestream/${sessionId}/participants`)
      .then((r) => r.data.data),

  // ── Moderation ────────────────────────────────────────────────────────────

  /** POST /livestream/:sessionId/mute */
  mute: (sessionId: string, data: ModerationAction) =>
    api.post<R<null>>(`/livestream/${sessionId}/mute`, data).then((r) => r.data),

  /** POST /livestream/:sessionId/kick */
  kick: (sessionId: string, data: ModerationAction) =>
    api.post<R<null>>(`/livestream/${sessionId}/kick`, data).then((r) => r.data),

  // ── Whiteboard Lock ───────────────────────────────────────────────────────

  /** POST /livestream/:sessionId/lock-whiteboard */
  lockWhiteboard: (sessionId: string) =>
    api.post<R<null>>(`/livestream/${sessionId}/lock-whiteboard`, { locked: true }).then((r) => r.data),

  /** POST /livestream/:sessionId/unlock-whiteboard */
  unlockWhiteboard: (sessionId: string) =>
    api
      .post<R<null>>(`/livestream/${sessionId}/unlock-whiteboard`, { locked: false })
      .then((r) => r.data),

  // ── Screen Share ──────────────────────────────────────────────────────────

  /**
   * POST /livestream/:sessionId/screenshare/start
   *
   * Sửa lại đúng (PR #18, re-review backend #59 — bản sửa §7.1 ban đầu ĐÃ
   * XOÁ NHẦM `user_id`): `dto.ScreenShareDTO.UserID` là ĐỐI TƯỢNG được
   * host/GV DUYỆT chia sẻ — rỗng = actor tự chia sẻ (host bật màn hình của
   * chính mình), có giá trị = actor (đã được `canManageSession` xác nhận là
   * host/GV/instructor/admin) cấp quyền publish cho một học sinh cụ thể.
   * Không phải danh tính người gọi (actor luôn lấy từ access token) — cùng
   * kiểu tham số với `ModerationActionDTO.user_id` (mute/kick), không phải
   * kiểu bị xoá ở §7.1 (JoinLiveSessionDTO.user_id — danh tính tự khai).
   */
  startScreenShare: (sessionId: string, targetUserId?: string) =>
    api
      .post<R<null>>(`/livestream/${sessionId}/screenshare/start`, {
        action: "start",
        ...(targetUserId ? { user_id: targetUserId } : {}),
      })
      .then((r) => r.data),

  /** POST /livestream/:sessionId/screenshare/stop — cùng ý nghĩa `targetUserId` như trên. */
  stopScreenShare: (sessionId: string, targetUserId?: string) =>
    api
      .post<R<null>>(`/livestream/${sessionId}/screenshare/stop`, {
        action: "stop",
        ...(targetUserId ? { user_id: targetUserId } : {}),
      })
      .then((r) => r.data),
};
