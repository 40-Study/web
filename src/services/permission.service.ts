/**
 * Permission service
 * Endpoints: /permissions
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  name: string;
  description?: string;
  category?: string;
  created_at?: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const permissionService = {
  /** GET /permissions */
  getAll: () =>
    api.get<R<{ permissions: Permission[] }>>("/permissions").then((r) => r.data.data.permissions),

  /** GET /permissions/:id */
  getById: (id: string) =>
    api.get<R<Permission>>(`/permissions/${id}`).then((r) => r.data.data),

  /** PUT /permissions/:id */
  update: (id: string, data: { description: string }) =>
    api.put<R<Permission>>(`/permissions/${id}`, data).then((r) => r.data.data),
};
