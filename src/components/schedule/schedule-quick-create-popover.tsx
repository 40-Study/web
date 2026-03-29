"use client";

/**
 * ScheduleQuickCreatePopover — Google Calendar-style compact create popup.
 * Appears next to drag selection with title input, time display, and quick save.
 * Rendered as a fixed-position portal to escape FullCalendar's overflow:hidden.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickCreateData {
  title: string;
  startTime: Date;
  endTime: Date;
}

interface ScheduleQuickCreatePopoverProps {
  /** Screen coordinates to anchor the popover */
  anchorX: number;
  anchorY: number;
  startTime: Date;
  endTime: Date;
  onSave: (data: QuickCreateData) => void;
  onMoreOptions: (data: QuickCreateData) => void;
  onClose: () => void;
}

/** Format a Date for display in header, e.g. "Thứ Hai, 23/3" */
function formatDateHeader(d: Date) {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}

/** Format time range display, e.g. "09:00 – 10:30" */
function formatTimeRange(start: Date, end: Date) {
  return `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`;
}

const POPOVER_WIDTH = 300;
const POPOVER_HEIGHT = 200; // approx

export default function ScheduleQuickCreatePopover({
  anchorX,
  anchorY,
  startTime,
  endTime,
  onSave,
  onMoreOptions,
  onClose,
}: ScheduleQuickCreatePopoverProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Auto-focus title input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Compute final position — keep within viewport
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  let left = anchorX + 12;
  let top = anchorY - 20;

  // Prevent overflow right
  if (left + POPOVER_WIDTH > vw - 16) {
    left = anchorX - POPOVER_WIDTH - 12;
  }
  // Prevent overflow bottom
  if (top + POPOVER_HEIGHT > vh - 16) {
    top = vh - POPOVER_HEIGHT - 16;
  }
  // Prevent overflow top
  if (top < 16) top = 16;

  const currentData: QuickCreateData = { title, startTime, endTime };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(currentData);
  };

  const handleMoreOptions = () => {
    onMoreOptions({ ...currentData, title: title || "Buổi học mới" });
  };

  return createPortal(
    <div
      ref={popoverRef}
      style={{ left, top, width: POPOVER_WIDTH }}
      className={cn(
        "fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-200",
        "animate-in fade-in-0 zoom-in-95 duration-150"
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-xs font-medium text-gray-500">
          {formatDateHeader(startTime)}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3">
        {/* Title input */}
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thêm tiêu đề"
          className={cn(
            "w-full text-base font-medium text-gray-900 placeholder:text-gray-400",
            "border-0 border-b-2 border-gray-200 focus:border-blue-500",
            "outline-none bg-transparent pb-1 transition-colors"
          )}
        />

        {/* Time display */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0" />
          <span className="font-medium">{formatTimeRange(startTime, endTime)}</span>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between pt-1">
          {/* More options link */}
          <button
            type="button"
            onClick={handleMoreOptions}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Thêm tùy chọn
            <ChevronRight className="w-3 h-3" />
          </button>

          {/* Save button */}
          <button
            type="submit"
            disabled={!title.trim()}
            className={cn(
              "px-4 py-1.5 text-sm font-semibold rounded-full transition-all",
              title.trim()
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            Lưu
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
