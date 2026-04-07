/**
 * Lesson content service — manage video, article, and attachments per lesson
 */

import { api } from "@/lib/api-client";
import type {
  LessonVideo,
  LessonArticle,
  LessonAttachment,
  CreateLessonVideoDTO,
  UpdateLessonVideoDTO,
  CreateLessonArticleDTO,
  UpdateLessonArticleDTO,
  CreateLessonAttachmentDTO,
} from "@/types/lesson-content";

export const lessonContentService = {
  // ─── Video ────────────────────────────────────────────────────────────────

  /** GET /lessons/:lessonId/video */
  getVideo: (lessonId: string) =>
    api
      .get<{ message: string; data: LessonVideo }>(`/lessons/${lessonId}/video`)
      .then((r) => r.data.data),

  /** POST /lessons/:lessonId/video */
  createVideo: (lessonId: string, data: CreateLessonVideoDTO) =>
    api
      .post<{ message: string; data: LessonVideo }>(`/lessons/${lessonId}/video`, data)
      .then((r) => r.data.data),

  /** PUT /lessons/:lessonId/video */
  updateVideo: (lessonId: string, data: UpdateLessonVideoDTO) =>
    api
      .put<{ message: string; data: LessonVideo }>(`/lessons/${lessonId}/video`, data)
      .then((r) => r.data.data),

  /** DELETE /lessons/:lessonId/video */
  deleteVideo: (lessonId: string) =>
    api
      .delete<{ message: string }>(`/lessons/${lessonId}/video`)
      .then((r) => r.data),

  // ─── Article ──────────────────────────────────────────────────────────────

  /** GET /lessons/:lessonId/article */
  getArticle: (lessonId: string) =>
    api
      .get<{ message: string; data: LessonArticle }>(`/lessons/${lessonId}/article`)
      .then((r) => r.data.data),

  /** POST /lessons/:lessonId/article */
  createArticle: (lessonId: string, data: CreateLessonArticleDTO) =>
    api
      .post<{ message: string; data: LessonArticle }>(`/lessons/${lessonId}/article`, data)
      .then((r) => r.data.data),

  /** PUT /lessons/:lessonId/article */
  updateArticle: (lessonId: string, data: UpdateLessonArticleDTO) =>
    api
      .put<{ message: string; data: LessonArticle }>(`/lessons/${lessonId}/article`, data)
      .then((r) => r.data.data),

  /** DELETE /lessons/:lessonId/article */
  deleteArticle: (lessonId: string) =>
    api
      .delete<{ message: string }>(`/lessons/${lessonId}/article`)
      .then((r) => r.data),

  // ─── Attachments ──────────────────────────────────────────────────────────

  /** GET /lessons/:lessonId/attachments */
  getAttachments: (lessonId: string) =>
    api
      .get<{ message: string; data: LessonAttachment[] }>(
        `/lessons/${lessonId}/attachments`
      )
      .then((r) => r.data.data),

  /** POST /lessons/:lessonId/attachments */
  createAttachment: (lessonId: string, data: CreateLessonAttachmentDTO) =>
    api
      .post<{ message: string; data: LessonAttachment }>(
        `/lessons/${lessonId}/attachments`,
        data
      )
      .then((r) => r.data.data),

  /** DELETE /lessons/:lessonId/attachments/:id */
  deleteAttachment: (lessonId: string, attachmentId: string) =>
    api
      .delete<{ message: string }>(`/lessons/${lessonId}/attachments/${attachmentId}`)
      .then((r) => r.data),
};
