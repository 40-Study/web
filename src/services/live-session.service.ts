/**
 * Live session service — buổi học trực tiếp (livestream nội bộ 40Study).
 *
 * Endpoints: /livestream (backend/internal/router/livestream_router.go)
 *
 * Phase 0 fix: trước đây service này gọi `/live-sessions` — một prefix KHÔNG
 * tồn tại ở backend, nên mọi lời gọi đều 404 và nút "Tạo buổi live" ở trang
 * giáo viên luôn thất bại. Nay khớp đúng contract của livestream_router:
 * body `dto.CreateLivestreamDTO`, response `dto.LivestreamResponseDTO`.
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Trạng thái phiên live theo model backend. */
export type LiveSessionStatus = "scheduled" | "live" | "ended";

/** Vai trò người tham gia — khớp `JoinLivestreamDTO.role` (oneof) ở backend. */
export type LiveParticipantRole = "teacher" | "assistant" | "student" | "viewer";

/** Cấu hình phòng live — khớp `model.LivestreamSettings` (backend). */
export interface LiveSessionSettings {
  is_chat_enabled: boolean;
  is_qa_enabled: boolean;
  is_whiteboard_enabled: boolean;
  is_screen_share_enabled: boolean;
  is_polls_enabled: boolean;
  whiteboard_locked: boolean;
}

/**
 * Response của `GET /livestream/:id` và `GET /livestream` — `dto.LivestreamResponseDTO`,
 * trong đó `settings` là **chuỗi JSON** (service Go marshal struct thành string).
 */
export interface LiveSession {
  id: string;
  title: string;
  description: string;
  host_id: string;
  class_id: string;
  course_id?: string;
  lesson_content_id?: string;
  room_name: string;
  status: LiveSessionStatus;
  started_at?: string;
  ended_at?: string;
  scheduled_at?: string;
  max_viewers: number;
  is_recorded: boolean;
  settings: string;
  created_at: string;
}

/**
 * Response của `POST /livestream` và `PUT /livestream/:id` — service Go trả thẳng
 * `*model.LivestreamSession`, KHÔNG qua `dto.LivestreamResponseDTO`
 * (backend/internal/service/livestream_service.go:20-27). Khác biệt so với
 * `LiveSession`: `settings` là **object** (`model.LivestreamSettings`) và
 * `description` là `*string` có `omitempty` nên có thể vắng mặt.
 *
 * Trước đây hai shape bị gộp làm một và `settings` khai là `string` — kiểu nói
 * dối, `tsc` không bắt được vì không nơi nào đọc field đó (Phase 0 review #8).
 */
export interface LiveSessionModel extends Omit<LiveSession, "settings" | "description"> {
  description?: string;
  settings: LiveSessionSettings;
}

/** `GET /livestream/:id` trả thêm số liệu realtime từ LiveKit. */
export interface LiveSessionDetail extends LiveSession {
  active_participants: number;
  num_publishers: number;
  active_recording: boolean;
}

/**
 * Body của `POST /livestream` — `dto.CreateLivestreamDTO`.
 *
 * KHÔNG có `host_id`: backend lấy host từ access token
 * (`LivestreamHandler.Create` → `extractUserID(c)`) và đã bỏ hẳn field này khỏi
 * DTO, vì nhận `host_id` từ body cho phép bất kỳ user đăng nhập nào tạo phiên
 * mang tên người khác (Phase 0 vòng 3, M-5).
 */
export interface CreateLiveSessionDTO {
  title: string;
  description?: string;
  /** Bắt buộc: backend parse UUID, thiếu sẽ lỗi "invalid class_id". */
  class_id: string;
  course_id?: string;
  lesson_content_id?: string;
  max_viewers?: number;
  is_recorded?: boolean;
  /** Chuỗi thời gian ISO; backend nhận dạng chuỗi và tự parse. */
  scheduled_at?: string;
}

/** Body của `PUT /livestream/:id` — `dto.UpdateLivestreamDTO` (chỉ 3 field). */
export interface UpdateLiveSessionDTO {
  title?: string;
  description?: string;
  max_viewers?: number;
}

/** Body của `POST /livestream/:id/join` — `dto.JoinLivestreamDTO`. */
export interface JoinLiveSessionDTO {
  user_id: string;
  name: string;
  role?: LiveParticipantRole;
}

/** `dto.ParticipantResponseDTO` — token LiveKit trả về, không bao giờ lên URL. */
export interface LiveParticipant {
  id: string;
  session_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  left_at?: string;
  is_active: boolean;
  token?: string;
  server_url?: string;
  room_name?: string;
}

export interface LiveSessionListParams {
  status?: LiveSessionStatus;
  host_id?: string;
  page?: number;
  page_size?: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const liveSessionService = {
  /** POST /livestream — tạo phiên live mới */
  create: (dto: CreateLiveSessionDTO) =>
    api.post<R<LiveSessionModel>>("/livestream", dto).then((r) => r.data.data),

  /**
   * GET /livestream — danh sách phiên live.
   *
   * Lưu ý: handler `GetAll` trả thẳng `dto.LivestreamListDTO` (không bọc trong
   * `data`), nên không dùng chung shape `R<T>` như các endpoint khác.
   */
  list: (params?: LiveSessionListParams) =>
    api
      .get<{ data: LiveSession[]; total: number; page: number; page_size: number }>("/livestream", {
        params,
      })
      .then((r) => ({ sessions: r.data.data, total: r.data.total })),

  /** GET /livestream/:id — chi tiết phiên live */
  getById: (id: string) =>
    api.get<R<LiveSessionDetail>>(`/livestream/${id}`).then((r) => r.data.data),

  /** PUT /livestream/:id — cập nhật tiêu đề / mô tả / số người xem tối đa */
  update: (id: string, dto: UpdateLiveSessionDTO) =>
    api.put<R<LiveSessionModel>>(`/livestream/${id}`, dto).then((r) => r.data.data),

  /** DELETE /livestream/:id — xoá/huỷ phiên live */
  delete: (id: string) =>
    api.delete<R<null>>(`/livestream/${id}`).then((r) => r.data),

  /** POST /livestream/:id/start — bắt đầu phiên */
  start: (id: string) =>
    api.post<R<LiveSessionModel>>(`/livestream/${id}/start`, {}).then((r) => r.data.data),

  /** POST /livestream/:id/end — kết thúc phiên */
  end: (id: string) =>
    api.post<R<LiveSessionModel>>(`/livestream/${id}/end`, {}).then((r) => r.data.data),

  /**
   * POST /livestream/:id/join — lấy token LiveKit cho người tham gia.
   *
   * Token nằm trong BODY response (`dto.ParticipantResponseDTO.token`) và được
   * giữ phía server — không nhét vào query URL để tránh lộ qua lịch sử trình
   * duyệt / access log / Referer.
   */
  join: (id: string, dto: JoinLiveSessionDTO) =>
    api.post<R<LiveParticipant>>(`/livestream/${id}/join`, dto).then((r) => r.data.data),

  /** POST /livestream/:id/leave — rời phiên */
  leave: (id: string, userId: string) =>
    api
      .post<R<null>>(`/livestream/${id}/leave`, { user_id: userId })
      .then((r) => r.data),
};
