"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { X, Maximize2, Minimize2, Play, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy-load the full IDE to avoid Monaco bundle hitting SSR
const CodeEditor = dynamic(
  () => import("@/components/code_sanbox/CodeEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-400 text-sm">
        Dang tai trinh soan thao...
      </div>
    ),
  }
);

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface FloatingSandboxProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_WIDTH = 500;
const MIN_HEIGHT = 400;
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 550;

export function FloatingSandbox({ isOpen, onClose }: FloatingSandboxProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 100, y: 100 });
  const [size, setSize] = useState<Size>({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number; posX: number; posY: number }>({
    x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0
  });
  const wasOpenRef = useRef(false);

  // Center the window on first open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current && !isExpanded) {
      const centerX = (window.innerWidth - size.width) / 2;
      const centerY = (window.innerHeight - size.height) / 2;
      setPosition({ x: Math.max(20, centerX), y: Math.max(20, centerY) });
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, isExpanded, size.height, size.width]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isExpanded) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [isExpanded, position]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const newX = Math.max(0, Math.min(window.innerWidth - size.width, dragStartRef.current.posX + deltaX));
    const newY = Math.max(0, Math.min(window.innerHeight - size.height, dragStartRef.current.posY + deltaY));

    setPosition({ x: newX, y: newY });
  }, [isDragging, size]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    if (isExpanded) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y,
    };
  }, [isExpanded, size, position]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeDirection) return;

    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;

    let newWidth = resizeStartRef.current.width;
    let newHeight = resizeStartRef.current.height;
    let newX = resizeStartRef.current.posX;
    let newY = resizeStartRef.current.posY;

    if (resizeDirection.includes("e")) {
      newWidth = Math.max(MIN_WIDTH, resizeStartRef.current.width + deltaX);
    }
    if (resizeDirection.includes("w")) {
      const widthDelta = resizeStartRef.current.width - deltaX;
      if (widthDelta >= MIN_WIDTH) {
        newWidth = widthDelta;
        newX = resizeStartRef.current.posX + deltaX;
      }
    }
    if (resizeDirection.includes("s")) {
      newHeight = Math.max(MIN_HEIGHT, resizeStartRef.current.height + deltaY);
    }
    if (resizeDirection.includes("n")) {
      const heightDelta = resizeStartRef.current.height - deltaY;
      if (heightDelta >= MIN_HEIGHT) {
        newHeight = heightDelta;
        newY = resizeStartRef.current.posY + deltaY;
      }
    }

    // Constrain to viewport
    newWidth = Math.min(newWidth, window.innerWidth - newX);
    newHeight = Math.min(newHeight, window.innerHeight - newY);
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    setSize({ width: newWidth, height: newHeight });
    setPosition({ x: newX, y: newY });
  }, [isResizing, resizeDirection]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);
  }, []);

  // Attach global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  if (!isOpen) return null;

  const handleToggleExpand = () => {
    if (isExpanded) {
      // Restore previous size and center
      const centerX = (window.innerWidth - DEFAULT_WIDTH) / 2;
      const centerY = (window.innerHeight - DEFAULT_HEIGHT) / 2;
      setPosition({ x: Math.max(20, centerX), y: Math.max(20, centerY) });
      setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
    }
    setIsExpanded((v) => !v);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed z-50 flex flex-col bg-gray-900 shadow-2xl overflow-hidden",
        isExpanded
          ? "inset-0 rounded-none"
          : "rounded-xl",
        (isDragging || isResizing) && "select-none"
      )}
      style={
        isExpanded
          ? undefined
          : {
              left: position.x,
              top: position.y,
              width: size.width,
              height: size.height,
            }
      }
    >
      {/* Title bar - draggable */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2.5 bg-gray-800 border-b border-gray-700 shrink-0",
          !isExpanded && "cursor-move"
        )}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          {/* Traffic-light dots */}
          <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            aria-label="Dong"
          />
          <button
            onClick={() => setIsExpanded(false)}
            className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors"
            aria-label="Thu nho"
          />
          <button
            onClick={handleToggleExpand}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
            aria-label="Phong to"
          />
          <div className="ml-3 flex items-center gap-2">
            <GripHorizontal className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-300 font-medium">MAIN.GO - CODE EDITOR</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Run Code button */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            RUN CODE
          </button>

          {/* Expand / collapse */}
          <button
            onClick={handleToggleExpand}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            aria-label={isExpanded ? "Thu nho" : "Phong to"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            aria-label="Dong"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-hidden">
        <CodeEditor />
      </div>

      {/* Resize handles - only show when not expanded */}
      {!isExpanded && (
        <>
          {/* Corner handles */}
          <div
            className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />
          <div
            className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />

          {/* Edge handles */}
          <div
            className="absolute top-0 left-4 right-4 h-1 cursor-n-resize"
            onMouseDown={(e) => handleResizeStart(e, "n")}
          />
          <div
            className="absolute bottom-0 left-4 right-4 h-1 cursor-s-resize"
            onMouseDown={(e) => handleResizeStart(e, "s")}
          />
          <div
            className="absolute left-0 top-4 bottom-4 w-1 cursor-w-resize"
            onMouseDown={(e) => handleResizeStart(e, "w")}
          />
          <div
            className="absolute right-0 top-4 bottom-4 w-1 cursor-e-resize"
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />

          {/* Visual resize indicator at bottom-right corner */}
          <div className="absolute bottom-1 right-1 text-gray-600 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="6" cy="10" r="1.5" />
              <circle cx="10" cy="6" r="1.5" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
