/**
 * Lesson service — CRUD for lessons
 * Endpoints: /sections/:sectionId/lessons, /lessons/:lessonId
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  is_preview?: boolean;
  is_mandatory?: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLessonDTO {
  title: string;
  description?: string;
  duration_minutes?: number;
  is_preview?: boolean;
  is_mandatory?: boolean;
}

export interface UpdateLessonDTO {
  title?: string;
  description?: string;
  duration_minutes?: number;
  is_preview?: boolean;
  is_mandatory?: boolean;
}

export interface ReorderItem {
  id: string;
  display_order: number;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const lessonService = {
  /** GET /sections/:sectionId/lessons */
  getLessons: (sectionId: string) =>
    api
      .get<{ message: string; data: Lesson[] }>(`/sections/${sectionId}/lessons`)
      .then((r) => r.data.data),

  /** GET /lessons/:lessonId */
  getLesson: (lessonId: string) =>
    api
      .get<{ message: string; data: Lesson }>(`/lessons/${lessonId}`)
      .then((r) => r.data.data),

  /** POST /sections/:sectionId/lessons */
  createLesson: (sectionId: string, data: CreateLessonDTO) =>
    api
      .post<{ message: string; data: Lesson }>(`/sections/${sectionId}/lessons`, data)
      .then((r) => r.data.data),

  /** PUT /lessons/:lessonId */
  updateLesson: (lessonId: string, data: UpdateLessonDTO) =>
    api
      .put<{ message: string; data: Lesson }>(`/lessons/${lessonId}`, data)
      .then((r) => r.data.data),

  /** PUT /sections/:sectionId/lessons/reorder */
  reorderLessons: (sectionId: string, items: ReorderItem[]) =>
    api
      .put<{ message: string }>(`/sections/${sectionId}/lessons/reorder`, { items })
      .then((r) => r.data),

  /** DELETE /lessons/:lessonId */
  deleteLesson: (lessonId: string) =>
    api
      .delete<{ message: string }>(`/lessons/${lessonId}`)
      .then((r) => r.data),
};
