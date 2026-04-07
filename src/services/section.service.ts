/**
 * Section service — CRUD for course sections
 * Endpoints: /courses/:courseId/sections
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Section {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSectionDTO {
  title: string;
  description?: string;
}

export interface UpdateSectionDTO {
  title?: string;
  description?: string;
}

export interface ReorderItem {
  id: string;
  display_order: number;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const sectionService = {
  /** GET /courses/:courseId/sections */
  getSections: (courseId: string) =>
    api
      .get<{ message: string; data: Section[] }>(`/courses/${courseId}/sections`)
      .then((r) => r.data.data),

  /** GET /courses/:courseId/sections/:sectionId */
  getSection: (courseId: string, sectionId: string) =>
    api
      .get<{ message: string; data: Section }>(`/courses/${courseId}/sections/${sectionId}`)
      .then((r) => r.data.data),

  /** POST /courses/:courseId/sections */
  createSection: (courseId: string, data: CreateSectionDTO) =>
    api
      .post<{ message: string; data: Section }>(`/courses/${courseId}/sections`, data)
      .then((r) => r.data.data),

  /** PUT /courses/:courseId/sections/:sectionId */
  updateSection: (courseId: string, sectionId: string, data: UpdateSectionDTO) =>
    api
      .put<{ message: string; data: Section }>(`/courses/${courseId}/sections/${sectionId}`, data)
      .then((r) => r.data.data),

  /** PUT /courses/:courseId/sections/reorder */
  reorderSections: (courseId: string, items: ReorderItem[]) =>
    api
      .put<{ message: string }>(`/courses/${courseId}/sections/reorder`, { items })
      .then((r) => r.data),

  /** DELETE /courses/:courseId/sections/:sectionId */
  deleteSection: (courseId: string, sectionId: string) =>
    api
      .delete<{ message: string }>(`/courses/${courseId}/sections/${sectionId}`)
      .then((r) => r.data),
};
