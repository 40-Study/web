/**
 * Category service — CRUD for course categories and tags
 * Moves getCategories out of course.service.ts and adds full admin CRUD
 */

import { api } from "@/lib/api-client";
import type { ApiCategory } from "@/services/course.service";

export interface Tag {
  id: string;
  name: string;
  slug?: string;
  created_at?: string;
}

export interface CreateCategoryDTO {
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  icon?: string;
  description?: string;
}

export const categoryService = {
  /**
   * GET /categories — list all categories (optionally filter by keyword)
   */
  getAll: (keyword?: string) =>
    api
      .get<{ message: string; data: ApiCategory[] }>("/categories", {
        params: keyword ? { keyword } : {},
      })
      .then((r) => r.data.data),

  /**
   * GET /categories/:id — get a single category
   */
  getById: (id: string) =>
    api
      .get<{ message: string; data: ApiCategory }>(`/categories/${id}`)
      .then((r) => r.data.data),

  /**
   * GET /categories/:id/courses — get courses belonging to a category
   */
  getCourses: (id: string) =>
    api
      .get<{ message: string; data: import("@/services/course.service").ApiCourse[] }>(
        `/categories/${id}/courses`
      )
      .then((r) => r.data.data),

  /**
   * POST /categories — create a category (admin)
   */
  create: (data: CreateCategoryDTO) =>
    api
      .post<{ message: string; data: ApiCategory }>("/categories", data)
      .then((r) => r.data.data),

  /**
   * PUT /categories/:id — update a category (admin)
   */
  update: (id: string, data: UpdateCategoryDTO) =>
    api
      .put<{ message: string; data: ApiCategory }>(`/categories/${id}`, data)
      .then((r) => r.data.data),

  /**
   * DELETE /categories/:id — delete a category (admin)
   */
  delete: (id: string) =>
    api
      .delete<{ message: string }>(`/categories/${id}`)
      .then((r) => r.data),

  // ─── Tags ─────────────────────────────────────────────────────────────────

  /** GET /tags — list all tags */
  getAllTags: () =>
    api
      .get<{ message: string; data: Tag[] }>("/tags")
      .then((r) => r.data.data),

  /** POST /tags — create a tag (admin) */
  createTag: (name: string) =>
    api
      .post<{ message: string; data: Tag }>("/tags", { name })
      .then((r) => r.data.data),

  /** DELETE /tags/:id — delete a tag (admin) */
  deleteTag: (id: string) =>
    api
      .delete<{ message: string }>(`/tags/${id}`)
      .then((r) => r.data),
};
