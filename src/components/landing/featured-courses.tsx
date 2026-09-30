"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from "@/components/course/course-card";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { useFeaturedCourses } from "@/hooks/use-courses";
import { cn } from "@/lib/utils";

const MAX_COURSES = 8;

/** Khóa học nổi bật. Không có dữ liệu (hoặc lỗi API) thì ẩn cả section, không hiện khung trống. */
export function FeaturedCourses() {
  const { data, isLoading } = useFeaturedCourses();
  const courses = (data ?? []).slice(0, MAX_COURSES);

  if (!isLoading && courses.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
      <ScrollReveal>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-sm font-semibold text-primary-600 dark:text-primary-400">
              Khóa học nổi bật
            </p>
            <h2 className="text-h2 text-slate-900 dark:text-slate-50">Bắt đầu với khóa học được chọn</h2>
          </div>
          <Link
            href="/courses"
            className={cn(buttonVariants({ variant: "ghost" }), "min-h-11 shrink-0 gap-2")}
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4 lg:gap-6">
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[340px] rounded-2xl" />
            ))
          : courses.map((course, i) => (
              <ScrollReveal key={course.id} delay={(i % 4) * 60} className="h-full">
                <CourseCard course={course} />
              </ScrollReveal>
            ))}
      </div>
    </section>
  );
}
