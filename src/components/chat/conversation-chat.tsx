"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, WifiOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryState } from "@/components/common/query-state";
import { CONVERSATION_BLOCKED_MESSAGE, isConversationBlockedError } from "@/lib/error-messages";
import { AuthError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  conversationKeys,
  useConversation,
  useMarkAsRead,
  useMessages,
  useSendMessage,
} from "@/hooks/queries/use-conversations";
import { useConversationSocket } from "@/hooks/use-conversation-socket";
import { useMarkConversationRead } from "@/app/(app)/messages/use-mark-conversation-read";
import { readDraft, writeDraft } from "@/lib/chat-draft";
import { MessageBubble } from "./message-bubble";
import {
  prependMessage,
  removeMessage,
  replaceMessage,
  type MessageListData,
} from "./message-cache";

/** Số tin nạp mỗi lần (giữ nguyên như trang Tin nhắn cũ). */
const PAGE_PARAMS = { page: 1, limit: 100 } as const;
/** Chu kỳ tải lại khi WebSocket không mở — lưới an toàn để không lỡ tin. */
export const CHAT_FALLBACK_POLL_MS = 8_000;

interface ConversationChatProps {
  conversationId: string;
  currentUserId: string;
  className?: string;
  /**
   * DM 1-1: hỏi chi tiết hội thoại để biết ngay khi mở có đang bị chặn không (`is_blocked`) và khoá ô nhập,
   * thay vì chờ lần gửi đầu bị 403. Chat nhóm không truyền (chi tiết nhóm nặng và không có cờ này).
   */
  isDirect?: boolean;
}

/**
 * Khung chat của một hội thoại: danh sách tin + ô soạn. Dùng chung cho trang Tin nhắn và tab
 * "Trò chuyện" của nhóm. Tin mới về qua WebSocket; rớt kết nối thì tự tải lại định kỳ và hiện
 * trạng thái "Đang kết nối lại".
 */
export function ConversationChat(props: ConversationChatProps) {
  // `key` theo (user, hội thoại): đổi hội thoại hoặc tài khoản thì khung chat được dựng lại với state sạch, nên
  // nháp chỉ cần đọc từ storage MỘT LẦN lúc khởi tạo (không đọc storage / ghi ref trong lúc render).
  return <ConversationChatInner key={`${props.currentUserId}:${props.conversationId}`} {...props} />;
}

function ConversationChatInner({ conversationId, currentUserId, className, isDirect = false }: ConversationChatProps) {
  const qc = useQueryClient();
  // Bản nháp lưu theo (user, conversation_id) ở sessionStorage (lib/chat-draft.ts) để quay lại danh sách rồi mở lại
  // không mất chữ. State là bản hiển thị; ref phản chiếu giá trị mới nhất cho callback onError (chỉ ghi trong handler).
  const [messageInput, setMessageInputState] = useState(() => readDraft(currentUserId, conversationId));
  const messageInputRef = useRef(messageInput);
  const setMessageInput = (text: string) => {
    messageInputRef.current = text;
    setMessageInputState(text);
    writeDraft(currentUserId, conversationId, text);
  };
  // DM bị chặn: khoá ô nhập. Lịch sử vẫn đọc được. Hai nguồn, khoá khi MỘT trong hai đúng:
  //  - `sentBlockedId`: hội thoại có lần gửi vừa bị 403 ERR_CONVERSATION_BLOCKED (chặn xảy ra sau khi mở khung
  //    chat). Lưu ID thay vì boolean vì trang Tin nhắn dùng lại cùng một component khi chọn DM khác: khoá của DM
  //    này không được dính sang DM kia;
  //  - `is_blocked` của server khi mở (chi tiết DM): khoá ngay từ đầu, không cần gửi thử.
  // Bỏ chặn rồi bấm "Thử lại": xoá khoá cục bộ và tải lại cờ của server; server vẫn báo chặn thì GIỮ khoá.
  const [sentBlockedId, setSentBlockedId] = useState<string | null>(null);
  const { data: conversation, refetch: refetchConversation } = useConversation(conversationId, { enabled: isDirect });
  const blocked = sentBlockedId === conversationId || conversation?.is_blocked === true;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { mutate: markAsRead } = useMarkAsRead();
  const sendMessage = useSendMessage(conversationId);

  const messagesKey = conversationKeys.messages(conversationId, PAGE_PARAMS.page);

  const { status } = useConversationSocket(conversationId, {
    onMessage: (message) => {
      qc.setQueryData<MessageListData>(messagesKey, (data) => prependMessage(data, message));
      qc.invalidateQueries({ queryKey: conversationKeys.list() });
      // Đang mở khung chat thì tin của người khác coi như đã đọc.
      if (message.sender_id !== currentUserId) markAsRead(conversationId);
    },
    onEdited: (message) => qc.setQueryData<MessageListData>(messagesKey, (data) => replaceMessage(data, message)),
    onDeleted: ({ message_id }) =>
      qc.setQueryData<MessageListData>(messagesKey, (data) => removeMessage(data, message_id)),
    // Nạp bù tin đã lỡ trong lúc mất kết nối.
    onReconnected: () => qc.invalidateQueries({ queryKey: conversationKeys.messages(conversationId) }),
  });

  const isLive = status === "open";
  const {
    data: msgData,
    isLoading,
    isError,
    error,
    refetch,
  } = useMessages(conversationId, PAGE_PARAMS, { refetchInterval: isLive ? false : CHAT_FALLBACK_POLL_MS });

  const messages = useMemo(() => msgData?.messages ?? [], [msgData?.messages]);

  // React Query v5 vẫn bật `isError` khi refetch nền lỗi trong lúc `data` cũ còn cache: chỉ hiện màn
  // lỗi khi không còn gì để hiển thị (Phase 0 review #5). 401 là nhịp đăng xuất — bỏ qua (MEDIUM #10),
  // giữ spinner để RoleGuard điều hướng thay vì nháy "khung chat trống" (L-2).
  const isAuth = error instanceof AuthError;
  const showError = isError && messages.length === 0 && !isAuth;
  const showBanner = isError && messages.length > 0 && !isAuth;
  const awaitingAuth = isError && messages.length === 0 && isAuth;

  useEffect(() => {
    // `block: "nearest"`: mặc định ("start") còn kéo cả trang xuống khi khung chat chiếm gần hết màn
    // hình điện thoại, làm tiêu đề hội thoại và nút quay lại trôi dưới header cố định.
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  useMarkConversationRead(conversationId, markAsRead);

  const handleSend = () => {
    if (blocked || !messageInput.trim()) return;
    const content = messageInput.trim();
    sendMessage.mutate(
      { content },
      {
        onError: (error) => {
          if (isConversationBlockedError(error)) setSentBlockedId(conversationId);
          // Trả lại bản nháp để người dùng không mất chữ vừa gõ — trừ khi họ đã gõ chữ mới trong lúc chờ.
          // (Callback của mutate không chạy sau khi unmount nên không cần xử lý trường hợp đã đổi hội thoại.)
          if (!messageInputRef.current) setMessageInput(content);
        },
      }
    );
    // Xoá nháp ngay khi gửi (không chờ phản hồi): chờ thì nháp cũ còn trong storage nếu khung chat unmount giữa chừng
    // và lần mở sau sẽ hiện lại tin đã gửi. Gửi lỗi thì onError ở trên trả lại. (Chuỗi rỗng = xoá khỏi storage.)
    setMessageInput("");
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {status === "reconnecting" && (
        <div
          role="status"
          className="flex items-center gap-2 border-b bg-amber-50 px-4 py-1.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          Đang kết nối lại… tin nhắn vẫn được cập nhật định kỳ.
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading || awaitingAuth ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" aria-label="Đang tải tin nhắn" />
          </div>
        ) : showError ? (
          // Lỗi tải tin nhắn không được hiển thị như khung chat trống (Phase 0).
          <QueryState isError error={error} onRetry={() => refetch()} className="border-none bg-transparent py-6">
            {null}
          </QueryState>
        ) : (
          <>
            {showBanner && (
              // L-5: role="alert" đặt trên thẻ bao ngoài, không đặt lên <button> (sẽ mất role button).
              <div
                role="alert"
                className="mb-3 w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
              >
                <button onClick={() => refetch()} className="w-full text-left">
                  Không làm mới được tin nhắn — bấm để thử lại.
                </button>
              </div>
            )}
            {messages.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên.
              </p>
            )}
            {[...messages].reverse().map((msg) => (
              <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === currentUserId} />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {blocked && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/50 px-4 py-2 text-sm text-muted-foreground"
        >
          <span>{CONVERSATION_BLOCKED_MESSAGE}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSentBlockedId(null);
              if (isDirect) void refetchConversation();
            }}
          >
            Thử lại
          </Button>
        </div>
      )}
      <div className="flex gap-2 border-t p-3">
        <Input
          placeholder={blocked ? "Không thể gửi tin nhắn" : "Nhập tin nhắn..."}
          disabled={blocked}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          className="flex-1"
          aria-label="Nhập tin nhắn"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={blocked || !messageInput.trim() || sendMessage.isPending}
          aria-label="Gửi tin nhắn"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
