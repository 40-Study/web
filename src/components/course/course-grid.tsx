"use client";

import { cn } from "@/lib/utils";
import { Course, EnrolledCourse } from "@/types/course";
import { CourseCard } from "./course-card";

interface CourseGridProps {
  courses: (Course | EnrolledCourse)[];
  className?: string;
  loading?: boolean;
}

function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card animate-pulse">
      <div className="aspect-video bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="flex justify-between items-center">
          <div className="h-6 bg-muted rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export function CourseGrid({ courses, className, loading }: CourseGridProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6",
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          Không tìm thấy khóa học nào
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6",
        className
      )}
    >
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
