/**
 * Ghi chú theo mốc thời gian trong bài học (contract §3).
 *
 * Endpoints:
 *  - GET/POST /lessons/:lessonId/notes
 *  - GET /courses/:courseId/notes?section_id=&sort=
 *  - PUT/DELETE /notes/:id
 */

import { api } from "@/lib/api-client";

export interface Note {
  id: string;
  lesson_id: string;
  lesson_title: string;
  section_id: string;
  section_title: string;
  course_id: string;
  /** Mốc thời gian trong video (giây) — bấm vào ghi chú để seek tới đây. */
  timestamp_seconds: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteDTO {
  timestamp_seconds: number;
  content: string;
}

export interface UpdateNoteDTO {
  content: string;
  timestamp_seconds?: number;
}

/** Thứ tự sắp xếp danh sách ghi chú của khoá — contract §3 (`?sort=newest|oldest`). */
export type NoteSort = "newest" | "oldest";

type R<T> = { message: string; data: T };

export const notesService = {
  /** GET /lessons/:lessonId/notes */
  listByLesson: (lessonId: string) =>
    api.get<R<Note[]>>(`/lessons/${lessonId}/notes`).then((r) => r.data.data),

  /** POST /lessons/:lessonId/notes */
  create: (lessonId: string, data: CreateNoteDTO) =>
    api.post<R<Note>>(`/lessons/${lessonId}/notes`, data).then((r) => r.data.data),

  /**
   * GET /courses/:courseId/notes
   * `section_id` lọc theo chương hiện tại ("Trong chương hiện tại" ở UI).
   */
  listByCourse: (courseId: string, params?: { section_id?: string; sort?: NoteSort }) =>
    api
      .get<R<Note[]>>(`/courses/${courseId}/notes`, {
        params: {
          ...(params?.section_id ? { section_id: params.section_id } : {}),
          ...(params?.sort ? { sort: params.sort } : {}),
        },
      })
      .then((r) => r.data.data),

  /** PUT /notes/:id */
  update: (noteId: string, data: UpdateNoteDTO) =>
    api.put<R<Note>>(`/notes/${noteId}`, data).then((r) => r.data.data),

  /** DELETE /notes/:id */
  remove: (noteId: string) =>
    api.delete<R<null>>(`/notes/${noteId}`).then((r) => r.data),
};
