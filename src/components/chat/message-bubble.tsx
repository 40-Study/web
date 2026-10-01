"use client";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Message } from "@/services/conversation.service";

/** Bong bóng một tin nhắn (trích nguyên từ trang Tin nhắn để chat nhóm dùng chung). */
export function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
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
        {!isOwn && <p className="text-xs text-muted-foreground">{message.sender_name}</p>}
        <div
          className={cn(
            "px-3 py-2 rounded-2xl text-sm break-words",
            isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
          )}
        >
          {message.content}
          {message.is_edited && <span className="text-[10px] opacity-70 ml-1">(đã sửa)</span>}
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
