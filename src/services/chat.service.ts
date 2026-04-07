/**
 * Chat service — messaging in livestream sessions
 * Endpoints: /chat
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  user_name?: string;
  message: string;
  is_pinned?: boolean;
  created_at?: string;
}

export interface SendMessageDTO {
  session_id: string;
  user_id: string;
  message: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const chatService = {
  /** POST /chat/send */
  sendMessage: (data: SendMessageDTO) =>
    api.post<R<ChatMessage>>("/chat/send", data).then((r) => r.data.data),

  /** GET /chat/:sessionId/messages */
  getMessages: (sessionId: string) =>
    api.get<R<ChatMessage[]>>(`/chat/${sessionId}/messages`).then((r) => r.data.data),

  /** DELETE /chat/:messageId */
  deleteMessage: (messageId: string) =>
    api.delete<R<null>>(`/chat/${messageId}`).then((r) => r.data),

  /** POST /chat/:messageId/pin */
  pinMessage: (messageId: string) =>
    api.post<R<null>>(`/chat/${messageId}/pin`, {}).then((r) => r.data),

  /** POST /chat/:messageId/unpin */
  unpinMessage: (messageId: string) =>
    api.post<R<null>>(`/chat/${messageId}/unpin`, {}).then((r) => r.data),
};
