"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  MessageSquare,
  Search,
  Loader2,
  Plus,
  Check,
  CheckCheck,
  Pin,
  MoreVertical,
  Smile,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useConversations } from "@/hooks/queries/use-conversations";
import { useAuthStore } from "@/stores/auth.store";
import { normalizeRole } from "@/lib/routes";
import { QueryState } from "@/components/common/query-state";
import { AuthError } from "@/lib/errors";
import type { Conversation } from "@/services/conversation.service";
import { ConversationChat } from "@/components/chat/conversation-chat";
import {
  conversationDisplayName,
  conversationMatchesQuery,
  conversationSubtitle,
} from "@/lib/conversation-display";
import { NewConversationDialog } from "./new-conversation-dialog";

/** Query `?conversation=<id>` — nút "Nhắn giảng viên" ở trang chi tiết con mở thẳng hội thoại vừa tạo. */
const CONVERSATION_PARAM = "conversation";

function ConversationItem({
  conversation,
  isSelected,
  onClick,
  currentUserId,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  currentUserId: string;
}) {
  const otherParticipant = conversation.participants?.find(
    (p) => p.user_id !== currentUserId
  );
  const displayName = conversationDisplayName(conversation, currentUserId);
  const isOnline = otherParticipant?.is_online ?? false;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
        isSelected ? "bg-primary/10" : "hover:bg-muted/50"
      )}
    >
      <div className="relative">
        <Avatar
          src={otherParticipant?.avatar_url ?? undefined}
          fallback={displayName[0]?.toUpperCase() ?? "?"}
          size="md"
          status={isOnline ? "online" : undefined}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm truncate">{displayName}</span>
          {conversation.last_message_at && (
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(conversation.last_message_at).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground truncate">
            {conversation.last_message?.content ?? "Chưa có tin nhắn"}
          </p>
          {conversation.unread_count > 0 && (
            <Badge className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px] bg-primary text-primary-foreground">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export default function MessagesPage() {
  const { user, activeRole } = useAuthStore();
  const role = normalizeRole(activeRole);
  // E2: phụ huynh cũng có nút "Tin nhắn mới" (giáo viên các khoá của con).
  const newConvAudience = role === "STUDENT" ? "student" : role === "PARENT" ? "parent" : null;
  // Quyết định màn hiển thị từ `?conversation=` ngay lần render đầu: đọc trong effect thì lần vẽ đầu còn là danh sách
  // rồi mới nhảy sang khung chat (nháy trên điện thoại). Không dùng useSearchParams để trang không phải bọc Suspense.
  // An toàn với SSR/hydration: layout (app) trả null tới khi store hydrate xong nên trang không bao giờ render ở server;
  // `typeof window` chỉ là chốt phòng khi có ai đó render server-side sau này.
  const [selectedConvId, setSelectedConvId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(CONVERSATION_PARAM)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewConvOpen, setIsNewConvOpen] = useState(false);

  const {
    data: convData,
    isLoading: convLoading,
    isError: convError,
    error: convErr,
    refetch: refetchConversations,
  } = useConversations();
  const conversations = useMemo(() => convData?.conversations ?? [], [convData?.conversations]);
  const currentUserId = user?.id ?? "";

  // MEDIUM (Phase 0 review #5): React Query v5 vẫn bật `isError` khi refetch nền
  // thất bại trong khi `data` cũ còn trong cache — chỉ hiện màn lỗi khi không còn gì để hiển thị.
  // MEDIUM #10: 401 (AuthError) là nhịp đăng xuất — bỏ qua để không nháy khung đỏ.
  // (Phần lỗi/tải của tin nhắn nằm trong components/chat/conversation-chat.tsx.)
  const showConvError = convError && conversations.length === 0 && !(convErr instanceof AuthError);
  const showConvBanner = convError && conversations.length > 0 && !(convErr instanceof AuthError);

  // L-2: 401 khi chưa có cache. Nhánh lỗi bị loại ở trên nên trước đây hộp thư rơi
  // xuống "Chưa có cuộc trò chuyện" / khung chat trống trong nhịp chờ điều hướng —
  // đọc thành "không có ai nhắn" thay vì "phiên đã hết hạn". Giữ spinner, để
  // RoleGuard/redirect xử lý điều hướng.
  const awaitingConvAuth = convError && conversations.length === 0 && convErr instanceof AuthError;

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const headerName = conversationDisplayName(selectedConv, currentUserId);
  const headerSubtitle = conversationSubtitle(selectedConv);

  // Quay lại danh sách (điện thoại). Bỏ luôn `?conversation=` khỏi URL: nếu để lại, tải lại trang hay
  // đóng/mở tab sẽ đọc lại tham số ở effect trên và đẩy người dùng vào đúng khung chat vừa rời.
  const handleBackToList = () => {
    setSelectedConvId(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has(CONVERSATION_PARAM)) {
      url.searchParams.delete(CONVERSATION_PARAM);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-primary" />
          Tin nhắn
        </h1>
        {/* Nút "+ Tin nhắn mới" — học sinh và phụ huynh (xem new-conversation-dialog.tsx). */}
        {newConvAudience && (
          <Button size="sm" onClick={() => setIsNewConvOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Tin nhắn mới
          </Button>
        )}
      </div>

      {newConvAudience && (
        <NewConversationDialog
          audience={newConvAudience}
          open={isNewConvOpen}
          onOpenChange={setIsNewConvOpen}
          onCreated={(id) => setSelectedConvId(id)}
        />
      )}

      {/*
        Thanh điều hướng dưới (bottom-nav) hiện tới hết breakpoint `lg` (`lg:hidden`, fixed), nên chỗ trừ cho nó phải
        kéo dài tới `lg`, không phải `md`: ở 768-1023px mà dùng 100vh-200px thì ô nhập bị thanh này che.
        `dvh` để thanh địa chỉ của trình duyệt di động không làm khung cao quá màn hình.
      */}
      <Card className="flex h-[calc(100dvh-250px)] lg:h-[calc(100dvh-200px)] overflow-hidden">
        {/*
          Bố cục theo màn hình: dưới md chỉ hiện MỘT trong hai khung (chưa chọn => danh sách, đã chọn
          => khung chat) vì cạnh nhau ở 390px khung chat bị bóp còn ~70px. Từ md trở lên luôn hai cột.
          Dùng `hidden` + `md:flex` thay vì render có điều kiện để ConversationChat không bị mount/unmount
          khi đổi kích thước cửa sổ.
        */}
        {/* Conversation list */}
        <div
          data-testid="conversation-list-panel"
          className={cn(
            "w-full md:w-80 border-r flex-col shrink-0",
            selectedConvId ? "hidden md:flex" : "flex"
          )}
        >
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {convLoading || awaitingConvAuth ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : showConvError ? (
              // Phase 0: trước đây lỗi API rơi vào nhánh "Chưa có cuộc trò chuyện",
              // khiến người dùng tưởng hộp thư rỗng thay vì lỗi tải.
              <QueryState
                isError
                error={convErr}
                onRetry={() => refetchConversations()}
                className="border-none bg-transparent py-6"
              >
                {null}
              </QueryState>
            ) : conversations.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Chưa có cuộc trò chuyện
              </p>
            ) : (
              <>
                {showConvBanner && (
                  /*
                    L-5: `role="alert"` phải nằm trên thẻ BAO NGOÀI, không đặt
                    thẳng lên `<button>` — đặt lên nút sẽ thay thế role ngầm định
                    `button` và trình đọc màn hình không còn đọc nó là nút bấm
                    (cart làm đúng như vậy).
                  */
                  <div
                    role="alert"
                    className="mb-1 w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                  >
                    <button onClick={() => refetchConversations()} className="w-full text-left">
                      Không làm mới được danh sách — bấm để thử lại.
                    </button>
                  </div>
                )}
                {conversations
                  .filter((c) => conversationMatchesQuery(c, searchQuery))
                  .map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isSelected={conv.id === selectedConvId}
                      onClick={() => setSelectedConvId(conv.id)}
                      currentUserId={currentUserId}
                    />
                  ))}
              </>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div
          data-testid="conversation-chat-panel"
          className={cn("flex-1 min-w-0 flex-col", selectedConvId ? "flex" : "hidden md:flex")}
        >
          {!selectedConvId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="h-14 border-b flex items-center px-4 gap-3">
                {/* Chỉ có ở điện thoại: từ md danh sách luôn hiện bên trái nên không cần nút này. */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden -ml-2 shrink-0"
                  aria-label="Quay lại danh sách hội thoại"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar
                  fallback={headerName[0]?.toUpperCase() ?? "C"}
                  size="sm"
                />
                <div>
                  <p className="font-medium text-sm">{headerName}</p>
                  {headerSubtitle && (
                    <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
                  )}
                </div>
              </div>

              <ConversationChat
                conversationId={selectedConvId}
                currentUserId={currentUserId}
                isDirect={selectedConv?.type === "DIRECT"}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
