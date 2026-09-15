"use client";

/**
 * Khu công cụ học tập dưới video: Ghi chú · Phụ đề · Hỏi đáp.
 *
 * Một chỗ duy nhất quyết định panel nào đang mở, để phím tắt `N` (contract §7)
 * và cú bấm chuột không tranh nhau state ở hai nơi.
 *
 * Phụ đề ẩn hẳn khi bài không có `.vtt` (contract §4) — không hiện tab rỗng.
 */

import { MessageCircleQuestion, StickyNote, Subtitles } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasSubtitleSource } from "@/lib/vtt-parser";
import { LessonNotesPanel } from "./lesson-notes-panel";
import { LessonQnA } from "./lesson-qna";
import { TranscriptPanel } from "./transcript-panel";

export type StudyToolKey = "notes" | "transcript" | "qna";

interface LessonStudyToolsProps {
  lessonId: string;
  courseId: string;
  lessonTitle?: string;
  sectionId?: string;
  subtitleUrl?: string | null;
  currentTime: number;
  onSeek: (timestampSeconds: number) => void;
  /** `null` = đóng hết panel. */
  activeTool: StudyToolKey | null;
  onToolChange: (tool: StudyToolKey | null) => void;
  composeToken: number;
  prefill: { text: string; timestampSeconds: number } | null;
  /** Transcript xin ghép một đoạn vào ghi chú — trang giữ state nên trang xử lý. */
  onPrefillFromTranscript: (prefill: { text: string; timestampSeconds: number }) => void;
}

export function LessonStudyTools({
  lessonId,
  courseId,
  lessonTitle,
  sectionId,
  subtitleUrl,
  currentTime,
  onSeek,
  activeTool,
  onToolChange,
  composeToken,
  prefill,
  onPrefillFromTranscript,
}: LessonStudyToolsProps) {
  const hasTranscript = hasSubtitleSource(subtitleUrl);

  const tabs: Array<{ key: StudyToolKey; label: string; icon: typeof StickyNote }> = [
    { key: "notes", label: "Ghi chú", icon: StickyNote },
    ...(hasTranscript
      ? [{ key: "transcript" as const, label: "Phụ đề", icon: Subtitles }]
      : []),
    { key: "qna", label: "Hỏi đáp", icon: MessageCircleQuestion },
  ];

  // Panel phụ đề có thể biến mất khi chuyển bài sang video không có `.vtt`;
  // đóng nó thay vì render một tab không còn tồn tại.
  const effectiveTool = activeTool === "transcript" && !hasTranscript ? null : activeTool;

  return (
    <div className="rounded-2xl bg-white shadow-sm">
      <div className="flex items-center gap-1 border-b border-gray-100 px-3 pt-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onToolChange(effectiveTool === key ? null : key)}
            aria-pressed={effectiveTool === key}
            className={cn(
              "flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors",
              effectiveTool === key
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {effectiveTool && (
        <div className="h-96">
          {effectiveTool === "notes" && (
            <LessonNotesPanel
              lessonId={lessonId}
              courseId={courseId}
              sectionId={sectionId}
              currentTime={currentTime}
              onSeek={onSeek}
              composeToken={composeToken}
              prefill={prefill}
            />
          )}

          {effectiveTool === "transcript" && (
            <TranscriptPanel
              subtitleUrl={subtitleUrl}
              currentTime={currentTime}
              onSeek={onSeek}
              onAddToNote={(text, timestampSeconds) =>
                onPrefillFromTranscript({ text, timestampSeconds })
              }
            />
          )}

          {effectiveTool === "qna" && <LessonQnA lessonId={lessonId} lessonTitle={lessonTitle} />}
        </div>
      )}
    </div>
  );
}
