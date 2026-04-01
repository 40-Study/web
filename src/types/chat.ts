/**
 * Chat type definitions
 */

export interface ChatRoom {
  id: string;
  name: string;
  type: "direct" | "group" | "class";
  class_id?: string;
  session_id?: string;
  participants: string[];
  last_message?: ChatMessage;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChatRoomDTO {
  name: string;
  type: "direct" | "group" | "class";
  class_id?: string;
  session_id?: string;
  participants?: string[];
}

export interface SendMessageDTO {
  room_id: string;
  content: string;
  type?: "text" | "image" | "file";
}
