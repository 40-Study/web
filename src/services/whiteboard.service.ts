/**
 * Whiteboard service — collaborative whiteboard per room
 * Endpoints: /whiteboards, /whiteboards/:id/elements
 */

import { api } from "@/lib/api-client";
import type {
  Whiteboard,
  WhiteboardElement,
  CreateWhiteboardDTO,
  UpdateWhiteboardDTO,
} from "@/types/whiteboard";

export const whiteboardService = {
  /** GET /whiteboards/:roomId */
  getWhiteboard: (roomId: string) =>
    api
      .get<{ data: Whiteboard }>(`/whiteboards/${roomId}`)
      .then((r) => r.data.data),

  /** POST /whiteboards */
  createWhiteboard: (data: CreateWhiteboardDTO) =>
    api
      .post<{ data: Whiteboard }>("/whiteboards", data)
      .then((r) => r.data.data),

  /** PUT /whiteboards/:id */
  updateWhiteboard: (id: string, data: UpdateWhiteboardDTO) =>
    api
      .put<{ data: Whiteboard }>(`/whiteboards/${id}`, data)
      .then((r) => r.data.data),

  /** GET /whiteboards/:id/elements */
  getElements: (id: string) =>
    api
      .get<{ data: WhiteboardElement[] }>(`/whiteboards/${id}/elements`)
      .then((r) => r.data.data),

  /** POST /whiteboards/:id/elements */
  addElement: (id: string, element: Omit<WhiteboardElement, "id">) =>
    api
      .post<{ data: WhiteboardElement }>(`/whiteboards/${id}/elements`, element)
      .then((r) => r.data.data),
};
