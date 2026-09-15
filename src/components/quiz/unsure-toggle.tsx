"use client";

/**
 * Cờ "Chưa chắc" khi làm bài (contract §6).
 *
 * Đây là tính năng HOÀN TOÀN phía client: cờ giúp người học tự soi lại, KHÔNG gửi
 * lên server và không ảnh hưởng điểm. Vì vậy nó sống trong state của màn làm bài,
 * và mọi thay đổi câu trả lời KHÔNG được xoá cờ — người học đánh dấu để quay lại,
 * sửa xong vẫn muốn thấy nó còn đó.
 *
 * Dùng chung cho cả quiz trong bài học và quiz độc lập: một cách đánh dấu duy nhất,
 * không mỗi màn một kiểu.
 */

import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tập id câu hỏi đang được đánh dấu "chưa chắc". */
export type UnsureSet = Set<string>;

/** Đảo cờ của một câu — hàm thuần, trả Set mới để React thấy thay đổi. */
export function toggleUnsure(unsure: UnsureSet, questionId: string): UnsureSet {
  const next = new Set(unsure);
  if (next.has(questionId)) {
    next.delete(questionId);
  } else {
    next.add(questionId);
  }
  return next;
}

/** Số câu còn đánh dấu — nhắc người học soi lại trước khi nộp. */
export function countUnsure(unsure: UnsureSet): number {
  return unsure.size;
}

interface UnsureToggleProps {
  isUnsure: boolean;
  onToggle: () => void;
  /** Bản gọn chỉ có icon, dùng ở thanh điều hướng giữa hai câu. */
  compact?: boolean;
  className?: string;
}

export function UnsureToggle({ isUnsure, onToggle, compact = false, className }: UnsureToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isUnsure}
      title={isUnsure ? "Bỏ đánh dấu chưa chắc" : "Đánh dấu câu này là chưa chắc"}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-colors",
        compact ? "p-2.5" : "px-2.5 py-2",
        isUnsure
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700",
        className
      )}
    >
      <Flag className={cn("h-4 w-4", isUnsure && "fill-amber-400 text-amber-500")} aria-hidden="true" />
      {!compact && (isUnsure ? "Chưa chắc" : "Chưa chắc?")}
    </button>
  );
}

/** Nhắc trước khi nộp: còn bao nhiêu câu tự thấy chưa chắc. */
export function UnsureSummary({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <p className="text-xs text-amber-700">
      Bạn còn đánh dấu {count} câu là chưa chắc. Soi lại trước khi nộp nhé.
    </p>
  );
}
