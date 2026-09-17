"use client";

/**
 * Băng báo khi tải bài học thất bại (bước 9 — microcopy trấn an).
 *
 * Câu bắt buộc: "Không tải được bài học. Tiến trình học của bạn không bị ảnh
 * hưởng." — người học vừa mất video vừa lo mất tiến độ, nên câu này phải đi kèm
 * lỗi chứ không được để một dòng "Có lỗi xảy ra" trần.
 *
 * KHÔNG dùng `text-red-500` trên nền đỏ đậm: đây là lỗi tạm thời của đường tải,
 * không phải lỗi người học gây ra — tông cảnh báo nhẹ, kèm nút thử lại.
 */

import { AlertCircle, RotateCw } from "lucide-react";
import { LESSON_LOAD_ERROR_MESSAGE } from "@/lib/lesson-lock";

interface LessonLoadErrorProps {
  /** Gọi lại khi người học bấm "Thử lại" — bỏ trống thì ẩn nút. */
  onRetry?: () => void;
  className?: string;
}

export function LessonLoadError({ onRetry, className }: LessonLoadErrorProps) {
  return (
    <div
      role="status"
      className={
        className ??
        "flex flex-col items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center"
      }
    >
      <div className="flex items-center gap-2 text-amber-700">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium">{LESSON_LOAD_ERROR_MESSAGE}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
          Thử lại
        </button>
      )}
    </div>
  );
}
