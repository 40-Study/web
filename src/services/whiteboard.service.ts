/**
 * Whiteboard service — snapshot and event management
 * Endpoints: /whiteboard/:sessionId/snapshot, /whiteboard/:sessionId/event
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WhiteboardSnapshot {
  session_id: string;
  snapshot_data: string;
  version: number;
  updated_at?: string;
}

export interface SaveSnapshotDTO {
  session_id: string;
  snapshot_data: string;
  version: number;
}

export interface WhiteboardEventDTO {
  type: string;
  action: string;
  payload: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const whiteboardService = {
  /** GET /whiteboard/:sessionId/snapshot */
  getSnapshot: (sessionId: string) =>
    api.get<R<WhiteboardSnapshot>>(`/whiteboard/${sessionId}/snapshot`).then((r) => r.data.data),

  /** POST /whiteboard/:sessionId/snapshot */
  saveSnapshot: (sessionId: string, data: SaveSnapshotDTO) =>
    api
      .post<R<WhiteboardSnapshot>>(`/whiteboard/${sessionId}/snapshot`, data)
      .then((r) => r.data.data),

  /** POST /whiteboard/:sessionId/event */
  sendEvent: (sessionId: string, data: WhiteboardEventDTO) =>
    api
      .post<R<null>>(`/whiteboard/${sessionId}/event`, data)
      .then((r) => r.data),
};
