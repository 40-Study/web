/**
 * Category & Tag service
 * Endpoints: /categories, /tags
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  parent_id?: string | null;
  description?: string;
  icon_url?: string | null;
  display_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoryDTO {
  name: string;
  parent_id?: string | null;
  description?: string;
  icon_url?: string | null;
  display_order?: number;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  created_at?: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const categoryService = {
  // ── Categories (public GET, auth for CUD) ─────────────────────────────────

  /** GET /categories — list all (public) */
  getAll: () =>
    api.get<R<Category[] | { categories: Category[] }>>("/categories").then((r) => {
      const d = r.data.data;
      return Array.isArray(d) ? d : d.categories;
    }),

  /** GET /categories/:id (public) */
  getById: (id: string) =>
    api.get<R<Category>>(`/categories/${id}`).then((r) => r.data.data),

  /** POST /categories (auth) */
  create: (data: CreateCategoryDTO) =>
    api.post<R<Category>>("/categories", data).then((r) => r.data.data),

  /** PUT /categories/:id (auth) */
  update: (id: string, data: UpdateCategoryDTO) =>
    api.put<R<Category>>(`/categories/${id}`, data).then((r) => r.data.data),

  /** DELETE /categories/:id (auth) */
  delete: (id: string) =>
    api.delete<R<null>>(`/categories/${id}`).then((r) => r.data),

  // ── Tags (public GET, auth for CUD) ───────────────────────────────────────

  /** GET /tags — list all tags (public) */
  getAllTags: (params?: { page?: number; page_size?: number; keyword?: string }) =>
    api.get<R<Tag[] | { tags: Tag[] }>>("/tags", { params }).then((r) => {
      const d = r.data.data;
      return Array.isArray(d) ? d : d.tags;
    }),

  /** GET /tags/:id (public) */
  getTagById: (id: string) =>
    api.get<R<Tag>>(`/tags/${id}`).then((r) => r.data.data),

  /** POST /tags (auth) */
  createTag: (name: string) =>
    api.post<R<Tag>>("/tags", { name }).then((r) => r.data.data),

  /** PUT /tags/:id (auth) */
  updateTag: (id: string, name: string) =>
    api.put<R<Tag>>(`/tags/${id}`, { name }).then((r) => r.data.data),

  /** DELETE /tags/:id (auth) */
  deleteTag: (id: string) =>
    api.delete<R<null>>(`/tags/${id}`).then((r) => r.data),
};
