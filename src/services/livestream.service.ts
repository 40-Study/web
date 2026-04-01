/**
 * Livestream service — CRUD + control operations
 * Endpoints: /livestreams, /livestreams/:id/start|stop|token
 */

import { api } from "@/lib/api-client";
import type {
  Livestream,
  LivestreamToken,
  CreateLivestreamDTO,
  UpdateLivestreamDTO,
} from "@/types/livestream";

export const livestreamService = {
  /** GET /livestreams */
  getAll: (params?: Record<string, string>) =>
    api
      .get<{ data: Livestream[] }>("/livestreams", { params })
      .then((r) => r.data.data),

  /** GET /livestreams/:id */
  getById: (id: string) =>
    api
      .get<{ data: Livestream }>(`/livestreams/${id}`)
      .then((r) => r.data.data),

  /** POST /livestreams */
  create: (data: CreateLivestreamDTO) =>
    api
      .post<{ data: Livestream }>("/livestreams", data)
      .then((r) => r.data.data),

  /** PUT /livestreams/:id */
  update: (id: string, data: UpdateLivestreamDTO) =>
    api
      .put<{ data: Livestream }>(`/livestreams/${id}`, data)
      .then((r) => r.data.data),

  /** DELETE /livestreams/:id */
  delete: (id: string) =>
    api.delete<void>(`/livestreams/${id}`).then(() => undefined),

  /** POST /livestreams/:id/start */
  start: (id: string) =>
    api
      .post<{ data: Livestream }>(`/livestreams/${id}/start`, {})
      .then((r) => r.data.data),

  /** POST /livestreams/:id/stop */
  stop: (id: string) =>
    api
      .post<{ data: Livestream }>(`/livestreams/${id}/stop`, {})
      .then((r) => r.data.data),

  /** GET /livestreams/:id/token */
  getToken: (id: string) =>
    api
      .get<{ data: LivestreamToken }>(`/livestreams/${id}/token`)
      .then((r) => r.data.data),
};
