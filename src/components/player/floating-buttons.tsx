"use client";

import { useState } from "react";
import { Code2, Send, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingButtonsProps {
  onSandboxOpen?: () => void;
  className?: string;
}

const QUICK_PROMPTS = [
  "Giải thích bài học này ngắn gọn",
  "Cho mình 3 bước để làm bài tập",
  "Checklist để hoàn thành bài này",
];

/** 6-dot grid icon (3x2) */
function GridDotsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="6" cy="9" r="2" />
      <circle cx="12" cy="9" r="2" />
      <circle cx="18" cy="9" r="2" />
      <circle cx="6" cy="15" r="2" />
      <circle cx="12" cy="15" r="2" />
      <circle cx="18" cy="15" r="2" />
    </svg>
  );
}

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
        <div className={cn("fixed bottom-20 right-6 z-30 flex flex-col gap-2", className)}>
          {/* AI Assistant button - gray/light background */}
          <button
            className="flex items-center gap-3 rounded-2xl bg-gray-100 py-3 pl-4 pr-5 text-gray-800 shadow-lg border border-gray-200 transition-all hover:bg-gray-200 hover:shadow-xl"
            onClick={() => {
              setAssistantOpen((prev) => !prev);
              setMenuOpen(false);
            }}
            aria-label="Mở AI Assistant"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold leading-tight">AI Assistant</p>
              <p className="text-xs leading-tight text-gray-500">Ask anything</p>
            </div>
          </button>

          {/* Sandbox button - blue background */}
          <button
            onClick={() => {
              onSandboxOpen?.();
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 rounded-2xl bg-primary-600 py-3 pl-4 pr-5 text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl"
            aria-label="Mở Sandbox"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <Code2 className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold leading-tight">Sandbox</p>
              <p className="text-xs leading-tight text-white/70">Coding lab</p>
            </div>
          </button>
        </div>
      )}

      {/* Grid menu toggle button - 6 dots */}
      <button
        onClick={() => setMenuOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105",
          isMenuOpen
            ? "bg-gray-800 text-white"
            : "bg-white text-primary-600 border border-gray-200"
        )}
        aria-label="Menu công cụ"
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <GridDotsIcon className="h-6 w-6" />}
      </button>
    </>
  );
}
