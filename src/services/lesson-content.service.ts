/**
 * Lesson content service — video, livestream, exercise contents per lesson
 * Endpoints: /lessons/:lessonId/contents, /lesson-contents/:contentId/classes
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ContentType = "video" | "livestream" | "exercise";

export interface LessonContent {
  id: string;
  lesson_id: string;
  type: ContentType;
  title: string;
  video_url?: string;
  duration?: number;
  exercise_id?: string;
  is_mandatory?: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVideoContentDTO {
  type: "video";
  title: string;
  video_url: string;
  duration?: number;
  is_mandatory?: boolean;
}

export interface CreateLivestreamContentDTO {
  type: "livestream";
  title: string;
  is_mandatory?: boolean;
}

export interface CreateExerciseContentDTO {
  type: "exercise";
  title: string;
  exercise_id: string;
  is_mandatory?: boolean;
}

export type CreateContentDTO =
  | CreateVideoContentDTO
  | CreateLivestreamContentDTO
  | CreateExerciseContentDTO;

export interface UpdateContentDTO {
  title?: string;
  duration?: number;
  is_mandatory?: boolean;
}

export interface ReorderItem {
  id: string;
  display_order: number;
}

// Class-Content Schedule
export interface ClassContentSchedule {
  content_id: string;
  class_id: string;
  open_date?: string;
  due_date?: string;
  scheduled_at?: string;
  end_at?: string;
  status?: string;
}

export interface CreateClassContentDTO {
  class_id: string;
  open_date?: string;
  due_date?: string;
  scheduled_at?: string;
  end_at?: string;
}

export interface BulkClassContentDTO {
  class_ids: string[];
  open_date?: string;
  due_date?: string;
}

export interface UpdateClassContentDTO {
  open_date?: string;
  due_date?: string;
  scheduled_at?: string;
  end_at?: string;
  status?: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const lessonContentService = {
  // ── Contents CRUD ─────────────────────────────────────────────────────────

  /** GET /lessons/:lessonId/contents */
  getContents: (lessonId: string) =>
    api.get<R<LessonContent[]>>(`/lessons/${lessonId}/contents`).then((r) => r.data.data),

  /** POST /lessons/:lessonId/contents */
  createContent: (lessonId: string, data: CreateContentDTO) =>
    api.post<R<LessonContent>>(`/lessons/${lessonId}/contents`, data).then((r) => r.data.data),

  /** PUT /lessons/:lessonId/contents/:contentId */
  updateContent: (lessonId: string, contentId: string, data: UpdateContentDTO) =>
    api
      .put<R<LessonContent>>(`/lessons/${lessonId}/contents/${contentId}`, data)
      .then((r) => r.data.data),

  /** PUT /lessons/:lessonId/contents/reorder */
  reorderContents: (lessonId: string, items: ReorderItem[]) =>
    api.put<R<null>>(`/lessons/${lessonId}/contents/reorder`, { items }).then((r) => r.data),

  /** DELETE /lessons/:lessonId/contents/:contentId */
  deleteContent: (lessonId: string, contentId: string) =>
    api.delete<R<null>>(`/lessons/${lessonId}/contents/${contentId}`).then((r) => r.data),

  // ── Class-Content Schedule ────────────────────────────────────────────────

  /** POST /lesson-contents/:contentId/classes — assign content to a class */
  assignToClass: (contentId: string, data: CreateClassContentDTO) =>
    api
      .post<R<ClassContentSchedule>>(`/lesson-contents/${contentId}/classes`, data)
      .then((r) => r.data.data),

  /** POST /lesson-contents/:contentId/classes/bulk — bulk assign to classes */
  bulkAssignToClasses: (contentId: string, data: BulkClassContentDTO) =>
    api
      .post<R<ClassContentSchedule[]>>(`/lesson-contents/${contentId}/classes/bulk`, data)
      .then((r) => r.data.data),

  /** GET /lesson-contents/:contentId/classes */
  getClassSchedules: (contentId: string, params?: { page?: number; page_size?: number }) =>
    api
      .get<R<{ schedules: ClassContentSchedule[]; total: number }>>(
        `/lesson-contents/${contentId}/classes`,
        { params }
      )
      .then((r) => r.data.data),

  /** PUT /lesson-contents/:contentId/classes/:classId */
  updateClassSchedule: (contentId: string, classId: string, data: UpdateClassContentDTO) =>
    api
      .put<R<ClassContentSchedule>>(`/lesson-contents/${contentId}/classes/${classId}`, data)
      .then((r) => r.data.data),

  /** DELETE /lesson-contents/:contentId/classes/:classId */
  removeFromClass: (contentId: string, classId: string) =>
    api.delete<R<null>>(`/lesson-contents/${contentId}/classes/${classId}`).then((r) => r.data),
};
