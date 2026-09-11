"use client";

/**
 * Mentor chat widget — TẠM BỎ AI (quyết định của user 2026-09-09, xem H8
 * trong plans/reports/code-reviewer-260909-1340-web-logic-integration.md).
 *
 * Bản cũ giả lập trả lời AI bằng setTimeout + chuỗi cứng, không gọi backend
 * thật (chưa có AI service). Widget này hiện KHÔNG được import ở đâu trong
 * app (đã grep) — giữ lại làm placeholder sẵn sàng bật lại khi có AI
 * service, hiển thị trạng thái rõ ràng thay vì giả lập.
 */

import { useState } from "react";
import { Bot, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MentorChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 rounded-2xl border bg-white p-5 text-center shadow-xl">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
          <Sparkles className="mx-auto mb-2 h-8 w-8 text-primary-500" />
          <p className="text-sm font-medium text-black">Trợ lý AI đang được phát triển</p>
          <p className="mt-1 text-xs text-neutral-500">
            Tính năng chat với gia sư AI chưa sẵn sàng. Vui lòng quay lại sau.
          </p>
        </div>
      )}
      <Button
        size="icon"
        className={cn("h-14 w-14 rounded-full shadow-lg", open && "bg-neutral-800 hover:bg-neutral-900")}
        onClick={() => setOpen((v) => !v)}
        aria-label="Trợ lý AI"
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
      </Button>
    </div>
  );
}
