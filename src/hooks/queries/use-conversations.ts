import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ForbiddenError } from "@/lib/errors";
import { conversationService } from "@/services/conversation.service";

export const conversationKeys = {
  all: ["conversations"] as const,
  list: () => [...conversationKeys.all, "list"] as const,
  detail: (id: string) => [...conversationKeys.all, "detail", id] as const,
  messages: (convId: string, page?: number) =>
    [...conversationKeys.all, "messages", convId, page] as const,
  unread: () => [...conversationKeys.all, "unread"] as const,
  search: (q: string) => [...conversationKeys.all, "search", q] as const,
};

export function useConversations(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: conversationKeys.list(),
    queryFn: () => conversationService.list(params),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: conversationKeys.detail(id),
    queryFn: () => conversationService.getById(id),
    enabled: !!id,
  });
}

/**
 * `options.refetchInterval`: chat realtime tắt polling khi WebSocket đang mở và bật lại khi rớt
 * (xem `components/chat/conversation-chat.tsx`). Không truyền = không polling như trước.
 */
export function useMessages(
  convId: string,
  params?: { page?: number; limit?: number },
  options?: { refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: conversationKeys.messages(convId, params?.page),
    queryFn: () => conversationService.getMessages(convId, params),
    enabled: !!convId,
    refetchInterval: options?.refetchInterval,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: conversationKeys.unread(),
    queryFn: () => conversationService.getUnreadCount(),
    refetchInterval: 30000,
  });
}

export function useCreateDirectConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => conversationService.createDirect(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: conversationKeys.all });
    },
    onError: (error) => toast.error(createDirectErrorMessage(error)),
  });
}

/**
 * Backend chặn tạo hội thoại trực tiếp giữa 2 người chưa có quan hệ (học viên-giảng viên,
 * phụ huynh-con, admin): 403 + code CONVERSATION_NOT_ALLOWED + message tiếng Việt.
 * api-client biến mọi 403 thành ForbiddenError (giữ nguyên message backend, mất `code`), nên
 * nhận diện theo lớp lỗi. Chỉ dùng message backend cho 403; lỗi khác giữ câu chung để không lộ
 * message tiếng Anh của tầng khác.
 */
export function createDirectErrorMessage(error: unknown): string {
  if (error instanceof ForbiddenError && error.message.trim()) return error.message;
  return "Không thể tạo cuộc trò chuyện";
}

export function useSendMessage(convId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content?: string; type?: string; reply_to_id?: string }) =>
      conversationService.sendMessage(convId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: conversationKeys.messages(convId) });
      qc.invalidateQueries({ queryKey: conversationKeys.list() });
    },
    onError: () => toast.error("Không thể gửi tin nhắn"),
  });
}

export function useEditMessage(convId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      conversationService.editMessage(convId, messageId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: conversationKeys.messages(convId) });
    },
  });
}

export function useDeleteMessage(convId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => conversationService.deleteMessage(convId, messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: conversationKeys.messages(convId) });
      qc.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (convId: string) => conversationService.markAsRead(convId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: conversationKeys.unread() });
    },
  });
}

export function useAddReaction(convId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      conversationService.addReaction(convId, messageId, emoji),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: conversationKeys.messages(convId) });
    },
  });
}
