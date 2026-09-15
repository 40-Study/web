"use client";

/**
 * Thông báo chặn khi người học cố mở bài chưa được mở (contract §2, bước 9).
 *
 * Một câu riêng cho mỗi `lock_reason` — "chưa học xong bài trước" và "chưa tham
 * gia khoá học" là hai tình huống khác nhau, dùng chung một câu chung chung thì
 * người học không biết phải làm gì tiếp.
 */

import Link from "next/link";
import { Lock } from "lucide-react";
import { describeLock } from "@/lib/lesson-lock";
import type { PlayerLesson } from "@/types/course-player";

interface LessonLockedNoticeProps {
  lesson: PlayerLesson;
  /** Về trang khoá học khi lý do là `not_enrolled`. */
  courseSlug?: string;
  /** Bài trước đó — nút "học tiếp" cho lý do `previous_incomplete`. */
  previousLesson?: PlayerLesson;
}

export function LessonLockedNotice({
  lesson,
  courseSlug,
  previousLesson,
}: LessonLockedNoticeProps) {
  const message = describeLock(lesson);
  if (!message) return null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-900 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
        <Lock className="h-5 w-5 text-white/70" aria-hidden="true" />
      </div>
      <p className="text-base font-medium text-white">{message}</p>
      <p className="max-w-sm text-sm text-white/60">
        {lesson.lockReason === "not_enrolled"
          ? "Tham gia khoá học để mở toàn bộ bài giảng."
          : "Hoàn thành bài học trước để mở bài này."}
      </p>
      {lesson.lockReason === "not_enrolled" && courseSlug ? (
        <Link
          href={`/courses/${courseSlug}`}
          className="mt-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Xem khoá học
        </Link>
      ) : previousLesson ? (
        <Link
          href={`/learn/${courseSlug}/${previousLesson.id}`}
          className="mt-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Quay lại: {previousLesson.title}
        </Link>
      ) : null}
    </div>
  );
}
