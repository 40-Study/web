"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
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
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkAsRead,
} from "@/hooks/queries/use-conversations";
import { useAuthStore } from "@/stores/auth.store";
import type { Conversation, Message } from "@/services/conversation.service";

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
  const displayName =
    conversation.name ?? otherParticipant?.user_name ?? "Cuộc trò chuyện";
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
            <Badge className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px] bg-primary">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  return (
    <div className={cn("flex gap-2 mb-3", isOwn ? "flex-row-reverse" : "")}>
      {!isOwn && (
        <Avatar
          src={message.sender_avatar ?? undefined}
          fallback={message.sender_name?.[0]?.toUpperCase() ?? "?"}
          size="xs"
          className="mt-1 shrink-0"
        />
      )}

      <div className={cn("max-w-[70%] space-y-1", isOwn ? "items-end" : "")}>
        {!isOwn && (
          <p className="text-xs text-muted-foreground">{message.sender_name}</p>
        )}
        <div
          className={cn(
            "px-3 py-2 rounded-2xl text-sm",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md"
          )}
        >
          {message.content}
          {message.is_edited && (
            <span className="text-[10px] opacity-70 ml-1">(đã sửa)</span>
          )}
        </div>
        <p className={cn("text-[10px] text-muted-foreground", isOwn && "text-right")}>
          {new Date(message.created_at).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: convData, isLoading: convLoading } = useConversations();
  const { data: msgData, isLoading: msgLoading } = useMessages(selectedConvId ?? "", {
    page: 1,
    limit: 100,
  });
  const sendMessage = useSendMessage(selectedConvId ?? "");
  const markAsRead = useMarkAsRead();

  const conversations = convData?.conversations ?? [];
  const messages = msgData?.messages ?? [];
  const currentUserId = user?.id ?? "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedConvId) {
      markAsRead.mutate(selectedConvId);
    }
  }, [selectedConvId]);

  const handleSend = () => {
    if (!messageInput.trim() || !selectedConvId) return;
    sendMessage.mutate({ content: messageInput.trim() });
    setMessageInput("");
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  return (
    <div className="container max-w-6xl mx-auto py-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
        <MessageSquare className="h-7 w-7 text-primary" />
        Tin nhắn
      </h1>

      <Card className="flex h-[calc(100vh-200px)] overflow-hidden">
        {/* Conversation list */}
        <div className="w-80 border-r flex flex-col shrink-0">
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
            {convLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Chưa có cuộc trò chuyện
              </p>
            ) : (
              conversations
                .filter(
                  (c) =>
                    !searchQuery ||
                    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.participants?.some((p) =>
                      p.user_name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                )
                .map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isSelected={conv.id === selectedConvId}
                    onClick={() => setSelectedConvId(conv.id)}
                    currentUserId={currentUserId}
                  />
                ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
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
                <Avatar
                  fallback={(selectedConv?.name ?? "C")[0].toUpperCase()}
                  size="sm"
                />
                <div>
                  <p className="font-medium text-sm">
                    {selectedConv?.name ??
                      selectedConv?.participants?.find((p) => p.user_id !== currentUserId)
                        ?.user_name ??
                      "Cuộc trò chuyện"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConv?.participants?.length ?? 0} thành viên
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {msgLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  [...messages].reverse().map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender_id === currentUserId}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="border-t p-3 flex gap-2">
                <Input
                  placeholder="Nhập tin nhắn..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!messageInput.trim() || sendMessage.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
