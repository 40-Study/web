/**
 * React Query hooks for chat rooms and messages
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatService } from "@/services/chat.service";
import type { CreateChatRoomDTO, SendMessageDTO } from "@/types/chat";

export const chatKeys = {
  all: ["chat"] as const,
  rooms: () => [...chatKeys.all, "rooms"] as const,
  messages: (roomId: string) => [...chatKeys.all, "messages", roomId] as const,
};

export function useChatRooms() {
  return useQuery({
    queryKey: chatKeys.rooms(),
    queryFn: () => chatService.getRooms(),
  });
}

export function useChatMessages(roomId: string, limit?: number) {
  return useQuery({
    queryKey: chatKeys.messages(roomId),
    queryFn: () => chatService.getMessages(roomId, limit),
    enabled: !!roomId,
    refetchInterval: 5000, // poll every 5s for new messages
  });
}

export function useCreateChatRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChatRoomDTO) => chatService.createRoom(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.rooms() });
      toast.success("Tạo phòng chat thành công");
    },
    onError: () => toast.error("Không thể tạo phòng chat"),
  });
}

export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageDTO) => chatService.sendMessage(data),
    onSuccess: (_, { room_id }) => {
      qc.invalidateQueries({ queryKey: chatKeys.messages(room_id) });
    },
    onError: () => toast.error("Không thể gửi tin nhắn"),
  });
}

export function useDeleteChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roomId }: { id: string; roomId: string }) =>
      chatService.deleteMessage(id),
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: chatKeys.messages(roomId) });
      toast.success("Đã xóa tin nhắn");
    },
    onError: () => toast.error("Không thể xóa tin nhắn"),
  });
}
