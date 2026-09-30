"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

export interface ContinueLearningCourse {
  slug: string;
  title: string;
  thumbnail?: string;
  category?: string;
  completedLessons: number;
  totalLessons: number;
  /** Phần trăm 0-100. */
  progress: number;
}

interface ContinueLearningCardProps {
  course: ContinueLearningCourse;
  className?: string;
}

/** Bài đang học = bài kế tiếp sau số bài đã hoàn thành, không vượt tổng số bài. */
export function getCurrentLessonNumber(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(completed + 1, total);
}

/**
 * Thẻ "Tiếp tục học" — hành động chính duy nhất above the fold.
 * Cả thẻ là vùng bấm (stretched link trên tiêu đề); nút CTA nằm trên lớp phủ.
 */
export function ContinueLearningCard({ course, className }: ContinueLearningCardProps) {
  const progress = Math.round(course.progress);
  const current = getCurrentLessonNumber(course.completedLessons, course.totalLessons);
  const href = `/courses/${course.slug}`;

  return (
    <Card
      hoverable
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl md:flex-row",
        className
      )}
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 md:w-72 md:self-stretch">
        {course.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnail}
            alt=""
            width={640}
            height={360}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen
              className="h-10 w-10 text-slate-300 dark:text-slate-600"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-5 lg:p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            Đang học gần đây
          </p>
          <h2 className="text-h3 line-clamp-2 text-slate-900 dark:text-slate-50">
            <Link
              href={href}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:rounded-3xl"
            >
              {course.title}
            </Link>
          </h2>
          {course.category && (
            <p className="text-body-sm text-slate-600 dark:text-slate-400">{course.category}</p>
          )}
        </div>

        <div className="space-y-2">
          <ProgressBar value={progress} variant="course" size="md" />
          <p className="text-body-sm tabular-nums text-slate-600 dark:text-slate-400">
            Bài {current}/{course.totalLessons} · {progress}%
          </p>
        </div>

        <div className="mt-auto">
          <Link
            href={href}
            className={cn(buttonVariants({ size: "lg" }), "relative z-10 w-full sm:w-auto")}
          >
            Tiếp tục học
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
