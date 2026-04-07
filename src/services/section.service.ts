/**
 * Section service — CRUD for course sections
 * All endpoints are nested under /courses/:courseId/sections
 */

import { api } from "@/lib/api-client";
import type {
  Section,
  CreateSectionDTO,
  UpdateSectionDTO,
} from "@/types/section";

export const sectionService = {
  /**
   * GET /courses/:courseId/sections — list all sections for a course
   */
  getSections: (courseId: string) =>
    api
      .get<{ message: string; data: Section[] }>(`/courses/${courseId}/sections`)
      .then((r) => r.data.data),

  /**
   * POST /courses/:courseId/sections — create a new section
   */
  createSection: (courseId: string, data: CreateSectionDTO) =>
    api
      .post<{ message: string; data: Section }>(`/courses/${courseId}/sections`, data)
      .then((r) => r.data.data),

  /**
   * PUT /courses/:courseId/sections/:id — update a section
   */
  updateSection: (courseId: string, id: string, data: UpdateSectionDTO) =>
    api
      .put<{ message: string; data: Section }>(`/courses/${courseId}/sections/${id}`, data)
      .then((r) => r.data.data),

  /**
   * DELETE /courses/:courseId/sections/:id — delete a section
   */
  deleteSection: (courseId: string, id: string) =>
    api
      .delete<{ message: string }>(`/courses/${courseId}/sections/${id}`)
      .then((r) => r.data),

  /**
   * PUT /courses/:courseId/sections/reorder — reorder sections by position
   */
  reorderSections: (courseId: string, sectionIds: string[]) =>
    api
      .put<{ message: string }>(`/courses/${courseId}/sections/reorder`, {
        section_ids: sectionIds,
      })
      .then((r) => r.data),
};
