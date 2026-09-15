/**
 * Enrollment service — enroll/unenroll and lesson progress
 * Endpoints: /courses/:courseId/enroll, /enrollments, /lessons/:lessonId/progress
 */

import { api } from "@/lib/api-client";
import type { PlayedRange } from "@/lib/played-ranges";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Enrollment {
  id: string;
  course_id: string;
  user_id: string;
  status?: string;
  progress_percentage?: number;
  enrolled_at?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProgressDTO {
  /**
   * KHÔNG gửi field này từ heartbeat (contract §1 — body không có field lạ).
   * Review vòng 1 (#8, quyết định Q4): server tự tính `status` từ
   * `watched_pct` và áp luật sticky; client gửi `status` mỗi 10 giây tạo rủi
   * ro thừa nếu backend lỡ dùng field này thay vì tính lại — dù đúng ý định
   * hiện tại là bỏ qua giá trị client gửi. Optional để chỉ còn dùng cho
   * đường cập nhật khác (không phải heartbeat), nếu có.
   */
  status?: string;
  progress_percentage?: number;
  video_watched_seconds?: number;
  /** Vị trí hiện tại (giây) — contract §1. */
  position_seconds?: number;
  /** Tổng thời lượng client đọc được (giây) — contract §1. */
  duration_seconds?: number;
  /** Các khoảng ĐÃ PHÁT THẬT kể từ lần gửi trước — contract §1. */
  played_ranges?: PlayedRange[];
}

/** Trạng thái tiến độ bài học do SERVER quyết định (contract §1). */
export interface LessonProgressResponse {
  lesson_id: string;
  status: "not_started" | "in_progress" | "completed";
  watched_seconds: number;
  watched_pct: number;
  last_position_seconds: number;
  completed_at: string | null;
  next_lesson_unlocked: boolean;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const enrollmentService = {
  /** POST /courses/:courseId/enroll */
  enroll: (courseId: string) =>
    api.post<R<Enrollment>>(`/courses/${courseId}/enroll`, {}).then((r) => r.data.data),

  /** DELETE /courses/:courseId/enroll */
  unenroll: (courseId: string) =>
    api.delete<R<null>>(`/courses/${courseId}/enroll`).then((r) => r.data),

  /** GET /enrollments */
  getAll: () =>
    api.get<R<Enrollment[]>>("/enrollments").then((r) => r.data.data),

  /** GET /enrollments/:enrollmentId */
  getById: (enrollmentId: string) =>
    api.get<R<Enrollment>>(`/enrollments/${enrollmentId}`).then((r) => r.data.data),

  /**
   * PUT /lessons/:lessonId/progress
   *
   * Trả `LessonProgressResponse` — `watched_pct`/`status` do SERVER tính từ
   * heartbeat (contract §1). Client không được tự đặt `status = completed`,
   * backend bỏ qua field đó.
   */
  updateProgress: (lessonId: string, data: UpdateProgressDTO) =>
    api
      .put<R<LessonProgressResponse>>(`/lessons/${lessonId}/progress`, data)
      .then((r) => r.data.data),
};
