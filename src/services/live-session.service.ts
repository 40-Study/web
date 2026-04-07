/**
 * Live session service - scheduled live sessions for courses/lessons
 * Endpoints: /live-sessions
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type LivePlatform = "40study" | "zoom" | "custom";

export interface LiveSession {
  id: string;
  course_id: string;
  lesson_id?: string;
  title: string;
  description?: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  platform: LivePlatform;
  custom_link?: string;
  enable_reminder: boolean;
  enable_recording: boolean;
  host_id: string;
  room_name?: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateLiveSessionDTO {
  course_id: string;
  lesson_id?: string;
  title: string;
  description?: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  platform: LivePlatform;
  custom_link?: string;
  enable_reminder?: boolean;
  enable_recording?: boolean;
}

export interface UpdateLiveSessionDTO extends Partial<Omit<CreateLiveSessionDTO, "course_id">> {}

export interface LiveSessionListParams {
  course_id?: string;
  lesson_id?: string;
  status?: LiveSession["status"];
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const liveSessionService = {
  /** POST /live-sessions - create a new live session */
  create: (dto: CreateLiveSessionDTO) =>
    api.post<R<LiveSession>>("/live-sessions", dto).then((r) => r.data.data),

  /** GET /live-sessions - list all sessions with optional filters */
  list: (params?: LiveSessionListParams) =>
    api
      .get<R<{ sessions: LiveSession[]; total: number }>>("/live-sessions", { params })
      .then((r) => r.data.data),

  /** GET /live-sessions/:id - get a single session */
  getById: (id: string) =>
    api.get<R<LiveSession>>(`/live-sessions/${id}`).then((r) => r.data.data),

  /** PUT /live-sessions/:id - update a session */
  update: (id: string, dto: UpdateLiveSessionDTO) =>
    api.put<R<LiveSession>>(`/live-sessions/${id}`, dto).then((r) => r.data.data),

  /** DELETE /live-sessions/:id - cancel/delete a session */
  delete: (id: string) =>
    api.delete<R<null>>(`/live-sessions/${id}`).then((r) => r.data),

  /** POST /live-sessions/:id/start - start the live session */
  start: (id: string) =>
    api.post<R<LiveSession>>(`/live-sessions/${id}/start`, {}).then((r) => r.data.data),

  /** POST /live-sessions/:id/end - end the live session */
  end: (id: string) =>
    api.post<R<LiveSession>>(`/live-sessions/${id}/end`, {}).then((r) => r.data.data),

  /** POST /live-sessions/:id/send-reminder - manually send reminder */
  sendReminder: (id: string) =>
    api.post<R<null>>(`/live-sessions/${id}/send-reminder`, {}).then((r) => r.data),

  /** GET /live-sessions/upcoming - get upcoming sessions for current user */
  getUpcoming: () =>
    api
      .get<R<LiveSession[]>>("/live-sessions/upcoming")
      .then((r) => r.data.data),

  /** POST /live-sessions/:id/attachments - upload attachments */
  uploadAttachments: (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return api
      .post<R<string[]>>(`/live-sessions/${id}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data);
  },
};
