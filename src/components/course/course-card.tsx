"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, BookOpen } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Course, EnrolledCourse } from "@/types/course";

interface CourseCardProps {
  course: Course | EnrolledCourse;
  className?: string;
  /** Ảnh above-the-fold: tải ngay thay vì lazy. */
  priority?: boolean;
}

const LEVEL_LABELS: Record<Course["level"], string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

function isEnrolledCourse(
  course: Course | EnrolledCourse
): course is EnrolledCourse {
  return "progress" in course;
}

export function CourseCard({ course, className, priority = false }: CourseCardProps) {
  const enrolled = isEnrolledCourse(course);
  const [imgError, setImgError] = useState(false);

  const hasDiscount =
    !!course.originalPrice && course.originalPrice > course.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - course.price / (course.originalPrice as number)) * 100)
    : 0;

  // Tối đa 1 badge; đã ghi danh thì không badge.
  const badge = enrolled
    ? null
    : course.price === 0
      ? { variant: "success" as const, label: "Miễn phí" }
      : hasDiscount
        ? { variant: "destructive" as const, label: `-${discountPercent}%` }
        : null;

  const meta = [course.category?.name, LEVEL_LABELS[course.level]]
    .filter(Boolean)
    .join(" · ");

  // Dữ liệu có thể thiếu (vd. khóa đã ghi danh): chỉ hiện khi có giá trị thật.
  const instructorName = course.instructor?.name?.trim();
  const hasRating = (course.reviewCount ?? 0) > 0 && (course.rating ?? 0) > 0;
  const hasStudents = (course.studentCount ?? 0) > 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card hoverable className={cn("flex h-full flex-col overflow-hidden", className)}>
        {/* Thumbnail */}
        <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
          {!imgError && course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              width={640}
              height={360}
              className="h-full w-full object-cover"
              loading={priority ? "eager" : "lazy"}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen
                className="h-10 w-10 text-slate-300 dark:text-slate-600"
                aria-hidden="true"
              />
            </div>
          )}
          {badge && (
            <Badge
              variant={badge.variant}
              className="absolute left-3 top-3 bg-white/95 shadow-xs backdrop-blur-sm dark:bg-slate-900/95"
            >
              {badge.label}
            </Badge>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 md:p-5">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {meta}
          </p>

          <h3 className="text-h4 mt-1 line-clamp-2 min-h-[56px] text-slate-900 dark:text-slate-50">
            {course.title}
          </h3>

          {instructorName && (
            <p className="text-body-sm mt-1 text-slate-600 dark:text-slate-400">
              {instructorName}
            </p>
          )}

          {(hasRating || hasStudents) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
              {hasRating && (
                <>
                  <Star
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-slate-900 dark:text-slate-50">
                    {(course.rating as number).toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    ({(course.reviewCount as number).toLocaleString("vi-VN")})
                  </span>
                </>
              )}
              {hasStudents && (
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {hasRating ? "· " : ""}
                  {(course.studentCount as number).toLocaleString("vi-VN")} học viên
                </span>
              )}
            </div>
          )}

          <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
            <div>
              {enrolled ? (
                <div className="space-y-2">
                  <ProgressBar value={course.progress} variant="course" size="sm" />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-600 tabular-nums dark:text-slate-400">
                      {course.progress}% · Bài {course.completedLessons}/{course.totalLessons}
                    </span>
                    {/* asChild → <span>: không lồng <button> trong <a>. */}
                    <Button asChild size="sm" variant="secondary">
                      <span>Tiếp tục</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-lg font-bold text-slate-900 dark:text-slate-50">
                    {course.price === 0 ? "Miễn phí" : formatCurrency(course.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-slate-500 line-through dark:text-slate-400">
                      {formatCurrency(course.originalPrice as number)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
