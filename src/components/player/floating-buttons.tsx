"use client";

import { useState } from "react";
import { Bot, Code2, GripHorizontal, Send, X } from "lucide-react";
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

/** Fixed floating action buttons: AI Assistant + Sandbox + menu grid (bottom-right) */
export function FloatingButtons({ onSandboxOpen, className }: FloatingButtonsProps) {
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");

  const submitMessage = () => {
    if (!message.trim()) return;
    setMessage("");
  };

  return (
    <>
      {/* AI Assistant chat panel */}
      {isAssistantOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[360px] overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-primary-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">AI Assistant</p>
              <p className="text-xs text-blue-100">Hỗ trợ nhanh trong lúc học</p>
            </div>
            <button
              onClick={() => setAssistantOpen(false)}
              className="rounded p-1 text-blue-100 hover:bg-white/10 hover:text-white"
              aria-label="Đóng AI Assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-900">
              Mình có thể giúp tóm tắt bài học, gợi ý cách làm bài tập, và checklist tự học.
            </div>

            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setMessage(prompt)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-xs hover:border-blue-300 hover:bg-blue-50"
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
                className="h-9 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-primary-400"
              />
              <button
                onClick={submitMessage}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                aria-label="Gửi câu hỏi"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expandable action buttons */}
      {isMenuOpen && (
        <div className={cn("fixed bottom-20 right-6 z-30 flex flex-col gap-3", className)}>
          <button
            className="flex items-center gap-3 rounded-2xl bg-primary-600 py-3 pl-4 pr-5 text-white shadow-lg transition-all hover:shadow-xl"
            onClick={() => {
              setAssistantOpen((prev) => !prev);
              setMenuOpen(false);
            }}
            aria-label="Mở AI Assistant"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold leading-tight">AI Assistant</p>
              <p className="text-xs leading-tight text-white/70">Ask anything</p>
            </div>
          </button>

          <button
            onClick={() => {
              onSandboxOpen();
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 rounded-2xl bg-primary-600 py-3 pl-4 pr-5 text-white shadow-lg transition-all hover:shadow-xl"
            aria-label="Mở Sandbox"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Code2 className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold leading-tight">Sandbox</p>
              <p className="text-xs leading-tight text-white/70">Coding lab</p>
            </div>
          </button>
        </div>
      )}

      {/* Grid menu toggle button */}
      <button
        onClick={() => setMenuOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110",
          isMenuOpen
            ? "bg-gray-800 text-white"
            : "bg-orange-500 text-white"
        )}
        aria-label="Menu công cụ"
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <GripHorizontal className="h-5 w-5" />}
      </button>
    </>
  );
}
