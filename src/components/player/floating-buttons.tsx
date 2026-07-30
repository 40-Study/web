"use client";

import { useState } from "react";
import { Code2, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIAssistantPanel } from "./ai-assistant-panel";
import { FloatingSandbox } from "./floating-sandbox";

interface FloatingButtonsProps {
  lessonContext?: {
    title: string;
    courseTitle: string;
    type: "video" | "quiz" | "exercise";
  };
  className?: string;
  /**
   * Cho phép trang cha tự xử lý nút Sandbox (vd. trang lesson mở
   * CodeEditorModal riêng). Không truyền -> dùng FloatingSandbox nội bộ.
   */
  onSandboxOpen?: () => void;
}

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
export function FloatingButtons({
  lessonContext,
  className,
  onSandboxOpen,
}: FloatingButtonsProps) {
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const [isSandboxOpen, setSandboxOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* AI Assistant Slide Panel */}
      <AIAssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setAssistantOpen(false)}
        lessonContext={lessonContext}
      />

      {/* Floating Sandbox */}
      <FloatingSandbox
        isOpen={isSandboxOpen}
        onClose={() => setSandboxOpen(false)}
      />

      {/* Expandable action buttons */}
      {isMenuOpen && (
        <div className={cn("fixed bottom-20 right-6 z-30 flex flex-col gap-2", className)}>
          {/* AI Assistant button - gray/light background */}
          <button
            className="flex items-center gap-3 rounded-2xl bg-gray-100 py-3 pl-4 pr-5 text-gray-800 shadow-lg border border-gray-200 transition-all hover:bg-gray-200 hover:shadow-xl hover:scale-[1.02]"
            onClick={() => {
              setAssistantOpen(true);
              setMenuOpen(false);
            }}
            aria-label="Mo AI Assistant"
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
              // Trang cha có handler riêng thì nhường; không thì mở sandbox nội bộ
              if (onSandboxOpen) onSandboxOpen();
              else setSandboxOpen(true);
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 rounded-2xl bg-primary-600 py-3 pl-4 pr-5 text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl hover:scale-[1.02]"
            aria-label="Mo Sandbox"
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
            ? "bg-gray-800 text-white rotate-90"
            : "bg-white text-primary-600 border border-gray-200"
        )}
        aria-label="Menu cong cu"
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <GridDotsIcon className="h-6 w-6" />}
      </button>
    </>
  );
}
