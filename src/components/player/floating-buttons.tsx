"use client";

import { useState } from "react";
import { Bot, Code2, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingButtonsProps {
  onSandboxOpen: () => void;
  className?: string;
}

const QUICK_PROMPTS = [
  "Giải thích bài học này ngắn gọn",
  "Cho mình 3 bước để làm bài tập",
  "Checklist để hoàn thành bài này",
];

/** Fixed floating action buttons: AI Assistant + Sandbox (bottom-right) */
export function FloatingButtons({ onSandboxOpen, className }: FloatingButtonsProps) {
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const [message, setMessage] = useState("");

  const submitMessage = () => {
    if (!message.trim()) return;
    setMessage("");
  };

  return (
    <>
      {isAssistantOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[360px] overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-purple-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">AI Assistant</p>
              <p className="text-xs text-purple-100">Hỗ trợ nhanh trong lúc học</p>
            </div>
            <button
              onClick={() => setAssistantOpen(false)}
              className="rounded p-1 text-purple-100 hover:bg-white/10 hover:text-white"
              aria-label="Đóng AI Assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <div className="rounded-xl bg-purple-50 p-3 text-xs text-purple-900">
              Mình có thể giúp tóm tắt bài học, gợi ý cách làm bài tập, và checklist tự học.
            </div>

            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setMessage(prompt)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-xs hover:border-purple-300 hover:bg-purple-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitMessage();
                }}
                placeholder="Nhập câu hỏi..."
                className="h-9 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-purple-400"
              />
              <button
                onClick={submitMessage}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                aria-label="Gửi câu hỏi"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={cn("fixed bottom-6 right-6 z-30 flex flex-col gap-3", className)}>
        <button
          className="flex items-center gap-3 rounded-full bg-purple-600 py-2.5 pl-3 pr-4 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          onClick={() => setAssistantOpen((prev) => !prev)}
          aria-label="Mở AI Assistant"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Bot className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold leading-tight">AI Assistant</p>
            <p className="text-xs leading-tight text-white/70">Hỏi bất kỳ điều gì</p>
          </div>
        </button>

        <button
          onClick={onSandboxOpen}
          className="flex items-center gap-3 rounded-full border border-gray-700 bg-gray-900 py-2.5 pl-3 pr-4 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          aria-label="Mở Sandbox"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
            <Code2 className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold leading-tight">Sandbox</p>
            <p className="text-xs leading-tight text-white/60">Coding lab</p>
          </div>
        </button>
      </div>
    </>
  );
}
