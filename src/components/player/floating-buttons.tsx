"use client";

import { Bot, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingButtonsProps {
  onSandboxOpen: () => void;
  className?: string;
}

/** Fixed floating action buttons: AI Assistant + Sandbox (bottom-right) */
export function FloatingButtons({ onSandboxOpen, className }: FloatingButtonsProps) {
  return (
    <div className={cn("fixed bottom-6 right-6 flex flex-col gap-3 z-30", className)}>
      {/* AI Assistant button */}
      <button
        className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        onClick={() => {
          // TODO: Open AI assistant chat panel
        }}
        aria-label="Mở AI Assistant"
      >
        <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4" />
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold leading-tight">AI Assistant</p>
          <p className="text-xs text-white/70 leading-tight">Hỏi bất kỳ điều gì</p>
        </div>
      </button>

      {/* Sandbox / Code editor button */}
      <button
        onClick={onSandboxOpen}
        className="flex items-center gap-3 bg-gray-900 text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all border border-gray-700"
        aria-label="Mở Sandbox"
      >
        <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center shrink-0">
          <Code2 className="w-4 h-4" />
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold leading-tight">Sandbox</p>
          <p className="text-xs text-white/60 leading-tight">Coding lab</p>
        </div>
      </button>
    </div>
  );
}
