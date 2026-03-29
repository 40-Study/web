"use client";

import { cn } from "@/lib/utils";
import { Course, EnrolledCourse } from "@/types/course";
import { CourseCard } from "./course-card";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

interface CourseGridProps {
  courses: (Course | EnrolledCourse)[];
  className?: string;
  loading?: boolean;
  /** Enable staggered scroll-reveal animation per card */
  staggered?: boolean;
}

function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white animate-pulse shadow-sm">
      <div className="aspect-video bg-slate-100" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-slate-100 rounded-lg w-3/4" />
        <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
        <div className="h-4 bg-slate-100 rounded-lg w-1/3" />
        <div className="flex justify-between items-center">
          <div className="h-6 bg-slate-100 rounded-lg w-24" />
        </div>
      </div>
    </div>
  );
}

export function CourseGrid({ courses, className, loading, staggered }: CourseGridProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6",
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
      <div className="text-center py-16">
        <p className="text-slate-400 text-lg">
          Không tìm thấy khóa học nào
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6",
        className
      )}
    >
      {courses.map((course, i) =>
        staggered ? (
          <ScrollReveal key={course.id} delay={Math.min(i * 80, 400)} direction="up">
            <CourseCard course={course} />
          </ScrollReveal>
        ) : (
          <CourseCard key={course.id} course={course} />
        )
      )}
    </div>
  );
}
