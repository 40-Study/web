"use client";

import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Course, EnrolledCourse } from "@/types/course";
import { CourseCard } from "./course-card";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface CourseGridProps {
  courses: (Course | EnrolledCourse)[];
  className?: string;
  loading?: boolean;
  /** Enable staggered scroll-reveal animation per card */
  staggered?: boolean;
  /** Hành động trong trạng thái rỗng (vd. nút "Xóa bộ lọc"). */
  emptyAction?: ReactNode;
}

const GRID_CLASS =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6 2xl:grid-cols-5";

/** Số card trên viewport đầu tiên (xl = 4 cột, 2xl = 5 cột): ảnh tải ngay. */
const PRIORITY_COUNT = 5;

function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <Skeleton className="aspect-video w-full rounded-none bg-slate-100 dark:bg-slate-800" />
      <div className="space-y-3 p-4 md:p-5">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-4 h-6 w-24" />
      </div>
    </div>
  );
}

export function CourseGrid({
  courses,
  className,
  loading,
  staggered,
  emptyAction,
}: CourseGridProps) {
  if (loading) {
    return (
      <div className={cn(GRID_CLASS, className)} aria-busy="true" role="status" aria-label="Đang tải khóa học">
        {Array.from({ length: 8 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700",
          className
        )}
      >
        <EmptyState
          icon={SearchX}
          title="Không tìm thấy khóa học nào"
          description="Thử đổi từ khóa hoặc bỏ bớt bộ lọc để xem thêm khóa học."
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className={cn(GRID_CLASS, className)}>
      {courses.map((course, i) =>
        staggered ? (
          <ScrollReveal key={course.id} delay={Math.min(i * 60, 300)} direction="up" className="h-full">
            <CourseCard course={course} priority={i < PRIORITY_COUNT} />
          </ScrollReveal>
        ) : (
          <CourseCard key={course.id} course={course} priority={i < PRIORITY_COUNT} />
        )
      )}
    </div>
  );
}
