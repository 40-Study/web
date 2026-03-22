"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";

// Lazy-load the full IDE to avoid Monaco bundle hitting SSR
const CodeEditor = dynamic(
  () => import("@/components/code_sanbox/CodeEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-400 text-sm">
        Đang tải trình soạn thảo...
      </div>
    ),
  }
);

interface CodeEditorModalProps {
  onClose: () => void;
}

/**
 * Floating modal wrapping the full CodeEditor (IDE).
 * Supports expand/collapse to fill screen.
 */
export function CodeEditorModal({ onClose }: CodeEditorModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    // Backdrop
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        // Close if clicking the backdrop directly (not modal content)
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Modal container */}
      <div
        className={
          isExpanded
            ? "fixed inset-0 flex flex-col bg-gray-900 rounded-none"
            : "w-full max-w-5xl h-[80vh] flex flex-col bg-gray-900 rounded-xl overflow-hidden shadow-2xl"
        }
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            {/* Traffic-light dots */}
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-3 text-sm text-gray-300 font-medium">Sandbox - Code Editor</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Expand / collapse */}
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              aria-label={isExpanded ? "Thu nhỏ" : "Phóng to"}
            >
              {isExpanded
                ? <Minimize2 className="w-4 h-4" />
                : <Maximize2 className="w-4 h-4" />
              }
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor content — fills remaining space */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor />
        </div>
      </div>
    </div>
  );
}
