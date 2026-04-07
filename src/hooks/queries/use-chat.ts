/**
 * React Query hooks for chat messages
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatService } from "@/services/chat.service";
import type { SendMessageDTO } from "@/services/chat.service";

export const chatKeys = {
  all: ["chat"] as const,
  messages: (sessionId: string) => [...chatKeys.all, "messages", sessionId] as const,
};

export function useChatMessages(sessionId: string) {
  return useQuery({
    queryKey: chatKeys.messages(sessionId),
    queryFn: () => chatService.getMessages(sessionId),
    enabled: !!sessionId,
    refetchInterval: 5000, // poll every 5s for new messages
  });
}

export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageDTO) => chatService.sendMessage(data),
    onSuccess: (_, { session_id }) => {
      qc.invalidateQueries({ queryKey: chatKeys.messages(session_id) });
    },
    onError: () => toast.error("Không thể gửi tin nhắn"),
  });
}

export function useDeleteChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sessionId }: { id: string; sessionId: string }) =>
      chatService.deleteMessage(id),
    onSuccess: (_, { sessionId }) => {
      qc.invalidateQueries({ queryKey: chatKeys.messages(sessionId) });
      toast.success("Đã xóa tin nhắn");
    },
    onError: () => toast.error("Không thể xóa tin nhắn"),
  });
}
