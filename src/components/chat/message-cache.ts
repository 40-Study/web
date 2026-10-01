/**
 * Cập nhật cache danh sách tin nhắn từ sự kiện WebSocket, không cần gọi lại API.
 *
 * API trả tin MỚI NHẤT TRƯỚC (`messages[0]` là tin mới nhất; UI đảo ngược khi hiển thị), nên tin
 * mới chèn ở đầu mảng. Mọi hàm đều trả về cùng tham chiếu nếu không có gì đổi để React Query không
 * render lại vô ích.
 */
import type { Message } from "@/services/conversation.service";

export interface MessageListData {
  messages: Message[];
  total_count: number;
}

/** Chèn tin mới; bỏ qua nếu đã có (tin do chính mình gửi có thể về cả bằng HTTP lẫn WebSocket). */
export function prependMessage(data: MessageListData | undefined, message: Message): MessageListData | undefined {
  if (!data) return data;
  if (data.messages.some((m) => m.id === message.id)) return data;
  return { messages: [message, ...data.messages], total_count: data.total_count + 1 };
}

export function replaceMessage(data: MessageListData | undefined, message: Message): MessageListData | undefined {
  if (!data) return data;
  if (!data.messages.some((m) => m.id === message.id)) return data;
  return { ...data, messages: data.messages.map((m) => (m.id === message.id ? message : m)) };
}

export function removeMessage(data: MessageListData | undefined, messageId: string): MessageListData | undefined {
  if (!data) return data;
  if (!data.messages.some((m) => m.id === messageId)) return data;
  return {
    messages: data.messages.filter((m) => m.id !== messageId),
    total_count: Math.max(0, data.total_count - 1),
  };
}
