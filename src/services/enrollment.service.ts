/**
 * Enrollment service — enroll/unenroll and lesson progress
 * Endpoints: /courses/:courseId/enroll, /enrollments, /lessons/:lessonId/progress
 */

import { api } from "@/lib/api-client";

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
  status: string;
  progress_percentage?: number;
  video_watched_seconds?: number;
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

  /** PUT /lessons/:lessonId/progress */
  updateProgress: (lessonId: string, data: UpdateProgressDTO) =>
    api.put<R<null>>(`/lessons/${lessonId}/progress`, data).then((r) => r.data),
};
