/**
 * Lesson service — CRUD for lessons nested under sections
 * Endpoints nested: /courses/:courseId/sections/:sectionId/lessons
 */

import { api } from "@/lib/api-client";
import type {
  Lesson,
  CreateLessonDTO,
  UpdateLessonDTO,
} from "@/types/lesson";

export const lessonService = {
  /**
   * GET /courses/:courseId/sections/:sectionId/lessons — list lessons in a section
   */
  getLessons: (courseId: string, sectionId: string) =>
    api
      .get<{ message: string; data: Lesson[] }>(
        `/courses/${courseId}/sections/${sectionId}/lessons`
      )
      .then((r) => r.data.data),

  /**
   * GET /lessons/:id — get a single lesson by ID
   */
  getLesson: (id: string) =>
    api
      .get<{ message: string; data: Lesson }>(`/lessons/${id}`)
      .then((r) => r.data.data),

  /**
   * POST /courses/:courseId/sections/:sectionId/lessons — create a lesson
   */
  createLesson: (courseId: string, sectionId: string, data: CreateLessonDTO) =>
    api
      .post<{ message: string; data: Lesson }>(
        `/courses/${courseId}/sections/${sectionId}/lessons`,
        data
      )
      .then((r) => r.data.data),

  /**
   * PUT /courses/:courseId/sections/:sectionId/lessons/:id — update a lesson
   */
  updateLesson: (courseId: string, sectionId: string, id: string, data: UpdateLessonDTO) =>
    api
      .put<{ message: string; data: Lesson }>(
        `/courses/${courseId}/sections/${sectionId}/lessons/${id}`,
        data
      )
      .then((r) => r.data.data),

  /**
   * DELETE /courses/:courseId/sections/:sectionId/lessons/:id — delete a lesson
   */
  deleteLesson: (courseId: string, sectionId: string, id: string) =>
    api
      .delete<{ message: string }>(
        `/courses/${courseId}/sections/${sectionId}/lessons/${id}`
      )
      .then((r) => r.data),

  /**
   * PUT /courses/:courseId/sections/:sectionId/lessons/reorder — reorder lessons
   */
  reorderLessons: (courseId: string, sectionId: string, lessonIds: string[]) =>
    api
      .put<{ message: string }>(
        `/courses/${courseId}/sections/${sectionId}/lessons/reorder`,
        { lesson_ids: lessonIds }
      )
      .then((r) => r.data),
};
