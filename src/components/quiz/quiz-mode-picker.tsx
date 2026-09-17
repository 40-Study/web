"use client";

/**
 * Chọn chế độ làm bài (contract §6).
 *
 * Hai chế độ khác nhau ở hậu quả, không chỉ ở nhãn — nên phần giải thích phải nói
 * rõ điều gì KHÔNG xảy ra ở chế độ luyện tập (không tính điểm, không đếm số lần
 * làm). Người học bấm "Luyện tập" mà không biết mình đang bỏ lần làm chính thức
 * thì đó là lỗi thiết kế, không phải lựa chọn.
 */

import { Loader2, PlayCircle, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizMode } from "@/services/quiz.service";

interface QuizModePickerProps {
  title?: string;
  /** Số lần đã làm, nếu màn có dữ liệu — chỉ để nhắc, không chặn. */
  attemptCount?: number;
  /** Số lần tối đa; `null`/`undefined` nghĩa là không giới hạn. */
  maxAttempts?: number | null;
  onSelect: (mode: QuizMode) => void;
  isStarting?: boolean;
  className?: string;
}

export function QuizModePicker({
  title,
  attemptCount,
  maxAttempts,
  onSelect,
  isStarting,
  className,
}: QuizModePickerProps) {
  const remaining =
    typeof maxAttempts === "number" && typeof attemptCount === "number"
      ? Math.max(0, maxAttempts - attemptCount)
      : null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        {title && <h1 className="text-xl font-semibold">{title}</h1>}
        <p className="text-sm text-muted-foreground">
          Chọn cách làm bài. Bạn có thể luyện tập không giới hạn trước khi làm bài chính thức.
        </p>
        {remaining !== null && (
          <p className="text-xs text-muted-foreground">
            Bạn còn {remaining} lần làm chính thức.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={isStarting}
          onClick={() => onSelect("official")}
          className="flex flex-col items-start gap-2 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlayCircle className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-semibold">Làm chính thức</span>
          <span className="text-sm text-muted-foreground">
            Tính điểm vào khoá và trừ vào số lần làm.
          </span>
        </button>

        <button
          type="button"
          disabled={isStarting}
          onClick={() => onSelect("practice")}
          className="flex flex-col items-start gap-2 rounded-2xl border-2 border-border p-4 text-left transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Dumbbell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span className="font-semibold">Luyện tập</span>
          <span className="text-sm text-muted-foreground">
            Không tính điểm, không đếm vào số lần làm.
          </span>
        </button>
      </div>

      {isStarting && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Đang mở đề...
        </p>
      )}
    </div>
  );
}
