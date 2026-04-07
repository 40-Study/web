/**
 * Chat service — room management and messaging
 * Endpoints: /chats, /chats/rooms
 */

import { api } from "@/lib/api-client";
import type { ChatMessage, ChatRoom, CreateChatRoomDTO, SendMessageDTO } from "@/types/chat";

export const chatService = {
  /** GET /chats/room/:roomId */
  getMessages: (roomId: string, limit?: number) =>
    api
      .get<{ data: ChatMessage[] }>(`/chats/room/${roomId}`, {
        params: limit ? { limit: String(limit) } : undefined,
      })
      .then((r) => r.data.data),

  /** POST /chats */
  sendMessage: (data: SendMessageDTO) =>
    api
      .post<{ data: ChatMessage }>("/chats", data)
      .then((r) => r.data.data),

  /** DELETE /chats/:id */
  deleteMessage: (id: string) =>
    api.delete<void>(`/chats/${id}`).then(() => undefined),

  /** GET /chats/rooms */
  getRooms: () =>
    api
      .get<{ data: ChatRoom[] }>("/chats/rooms")
      .then((r) => r.data.data),

  /** POST /chats/rooms */
  createRoom: (data: CreateChatRoomDTO) =>
    api
      .post<{ data: ChatRoom }>("/chats/rooms", data)
      .then((r) => r.data.data),
};
