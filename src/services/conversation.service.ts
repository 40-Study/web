import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  type: "DIRECT" | "GROUP";
  name?: string;
  group_id?: string;
  last_message?: Message;
  last_message_at?: string;
  message_count: number;
  unread_count: number;
  is_muted: boolean;
  is_pinned: boolean;
  participants: Participant[];
  created_at: string;
  updated_at: string;
}

export interface Participant {
  user_id: string;
  user_name: string;
  email: string;
  avatar_url?: string;
  is_online: boolean;
  joined_at: string;
  last_read_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id?: string;
  sender_name: string;
  sender_avatar?: string;
  type: string;
  content?: string;
  metadata?: unknown;
  reply_to?: {
    id: string;
    sender_id?: string;
    sender_name: string;
    content?: string;
    type: string;
  };
  status: string;
  is_edited: boolean;
  edited_at?: string;
  is_pinned: boolean;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  created_at: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface MessageAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  thumbnail_url?: string;
}

export interface UnreadCount {
  total_unread: number;
  conversations: { conversation_id: string; unread_count: number }[];
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const conversationService = {
  // Conversations
  list: (params?: { page?: number; limit?: number }) =>
    api
      .get<R<{ conversations: Conversation[]; total_count: number }>>("/conversations", { params })
      .then((r) => r.data.data),

  createDirect: (userId: string) =>
    api
      .post<R<Conversation>>("/conversations/direct", { user_id: userId })
      .then((r) => r.data.data),

  getById: (id: string) =>
    api.get<R<Conversation>>(`/conversations/${id}`).then((r) => r.data.data),

  markAsRead: (id: string) =>
    api.post(`/conversations/${id}/read`).then((r) => r.data),

  mute: (id: string) =>
    api.post(`/conversations/${id}/mute`).then((r) => r.data),

  unmute: (id: string) =>
    api.post(`/conversations/${id}/unmute`).then((r) => r.data),

  pin: (id: string) =>
    api.post(`/conversations/${id}/pin`).then((r) => r.data),

  unpin: (id: string) =>
    api.post(`/conversations/${id}/unpin`).then((r) => r.data),

  // Messages
  getMessages: (convId: string, params?: { page?: number; limit?: number }) =>
    api
      .get<R<{ messages: Message[]; total_count: number }>>(`/conversations/${convId}/messages`, {
        params,
      })
      .then((r) => r.data.data),

  sendMessage: (convId: string, data: { content?: string; type?: string; reply_to_id?: string }) =>
    api
      .post<R<Message>>(`/conversations/${convId}/messages`, data)
      .then((r) => r.data.data),

  editMessage: (convId: string, messageId: string, content: string) =>
    api
      .put<R<Message>>(`/conversations/${convId}/messages/${messageId}`, { content })
      .then((r) => r.data.data),

  deleteMessage: (convId: string, messageId: string) =>
    api.delete(`/conversations/${convId}/messages/${messageId}`).then((r) => r.data),

  pinMessage: (convId: string, messageId: string) =>
    api.post(`/conversations/${convId}/messages/${messageId}/pin`).then((r) => r.data),

  unpinMessage: (convId: string, messageId: string) =>
    api.post(`/conversations/${convId}/messages/${messageId}/unpin`).then((r) => r.data),

  // Reactions
  addReaction: (convId: string, messageId: string, emoji: string) =>
    api
      .post(`/conversations/${convId}/messages/${messageId}/reactions`, { emoji })
      .then((r) => r.data),

  removeReaction: (convId: string, messageId: string, emoji: string) =>
    api
      .delete(`/conversations/${convId}/messages/${messageId}/reactions/${emoji}`)
      .then((r) => r.data),

  // Search & unread
  searchMessages: (params: { q: string; conversation_id?: string; page?: number; limit?: number }) =>
    api
      .get<R<{ messages: Message[]; total_count: number }>>("/messages/search", { params })
      .then((r) => r.data.data),

  getUnreadCount: () =>
    api.get<R<UnreadCount>>("/messages/unread").then((r) => r.data.data),
};
