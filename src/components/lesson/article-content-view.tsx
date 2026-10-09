"use client";

import { BookOpen, CheckCircle2, Clock, Loader2 } from "lucide-react";
import type { LessonProgressResponse } from "@/services/enrollment.service";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useMarkLessonCompleted } from "@/components/player/non-video-lesson-content";

interface ArticleContentViewProps {
  lessonId: string;
  courseId: string;
  title: string;
  /** HTML Tiptap do giáo viên nhập — đầu vào KHÔNG tin cậy, chỉ render qua `sanitizeHtml`. */
  body?: string | null;
  /** Do server tính từ `article_body` (không lưu); vắng mặt thì không hiện dòng thời gian đọc. */
  readingTimeMinutes?: number;
  /** Bài đã `completed` theo curriculum của server. */
  completed: boolean;
  onProgress?: (progress: LessonProgressResponse) => void;
}

export const ARTICLE_EMPTY_MESSAGE = "Bài viết chưa có nội dung.";

/**
 * Hiển thị nội dung bài viết (content `article`) cho học viên (QA 261008 T1/T7).
 *
 * Bài viết không có video để server tự chấm, nên "đã đọc" là hành động của người học: gửi
 * `status: "completed"` qua cùng endpoint tiến độ mà bài tập/buổi live dùng
 * (`useMarkLessonCompleted`).
 */
export function ArticleContentView({
  lessonId,
  courseId,
  title,
  body,
  readingTimeMinutes,
  completed,
  onProgress,
}: ArticleContentViewProps) {
  const markRead = useMarkLessonCompleted({ lessonId, courseId, onProgress });
  const isDone = completed || markRead.data?.status === "completed";
  const safeHtml = sanitizeHtml(body);
  const hasBody = body != null && body.trim() !== "" && safeHtml.trim() !== "";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-primary-600">
        <span className="inline-flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Bài viết
        </span>
        {readingTimeMinutes && readingTimeMinutes > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-gray-500 font-normal">
            <Clock className="w-4 h-4" />
            {readingTimeMinutes} phút đọc
          </span>
        ) : null}
      </div>
      <h1 className="text-xl font-bold text-gray-900 break-words">{title}</h1>

      {hasBody ? (
        <div
          data-testid="article-body"
          className="prose prose-sm sm:prose-base max-w-none break-words text-gray-800"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <p className="text-sm text-gray-500">{ARTICLE_EMPTY_MESSAGE}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {isDone ? (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            Đã hoàn thành
          </span>
        ) : (
          <button
            type="button"
            onClick={() => markRead.mutate()}
            disabled={markRead.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            {markRead.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Đánh dấu đã đọc
          </button>
        )}
      </div>
    </div>
  );
}
