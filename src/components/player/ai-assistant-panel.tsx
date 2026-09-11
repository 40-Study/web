"use client";

/**
 * AI Assistant panel — TẠM BỎ AI (quyết định của user 2026-09-09, xem H8
 * trong plans/reports/code-reviewer-260909-1340-web-logic-integration.md).
 *
 * Bản cũ giả lập trả lời bằng setTimeout + generateMockResponse() chuỗi
 * cứng, không gọi backend AI thật. Giữ NGUYÊN props {isOpen, onClose,
 * lessonContext} vì player-client.tsx (thuộc lane UI) đang import component
 * này — chỉ thay nội dung bên trong bằng trạng thái "đang phát triển".
 */

import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lessonContext?: {
    title: string;
    courseTitle: string;
    type: "video" | "quiz" | "exercise";
  };
}

export function AIAssistantPanel({ isOpen, onClose, lessonContext }: AIAssistantPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-500" />
            <p className="text-sm font-semibold text-black">Trợ lý AI</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
            <Sparkles className="h-8 w-8 text-primary-500" />
          </div>
          <p className="text-sm font-medium text-black">Trợ lý AI đang được phát triển</p>
          <p className="text-xs text-neutral-500">
            Tính năng hỏi đáp AI cho bài học{lessonContext?.title ? ` "${lessonContext.title}"` : ""}{" "}
            chưa sẵn sàng. Chúng tôi sẽ thông báo khi ra mắt.
          </p>
        </div>
      </div>
    </>
  );
}
