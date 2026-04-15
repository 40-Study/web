"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, BookOpen } from "lucide-react";

interface FeaturedCourseCardCourse {
  id: string;
  slug: string;
  title: string;
  thumbnail?: string;
  tags: string[];
  progress: number;
  completedLessons: number;
  totalLessons: number;
  nextLesson: string;
}

interface FeaturedCourseCardProps {
  course: FeaturedCourseCardCourse;
}

export function FeaturedCourseCard({ course }: FeaturedCourseCardProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-800 to-primary-950 text-white min-h-[220px] flex flex-col justify-between shadow-lg">
      {/* Background image */}
      {course.thumbnail && (
        <div className="absolute inset-0">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover opacity-30"
            sizes="(max-width: 1024px) 100vw, 66vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-900/70 to-transparent" />
        </div>
      )}
      {/* Fallback decoration when no thumbnail */}
      {!course.thumbnail && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        </div>
      )}

      <div className="relative z-10 flex gap-8 items-start p-8">
        {/* Left: Info */}
        <div className="flex-1">
          {/* Tags */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {course.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-white/10 text-white/80 text-[10px] font-semibold rounded-full border border-white/20"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold mb-2 leading-snug max-w-lg">{course.title}</h3>

          {/* Next lesson */}
          <div className="flex items-center gap-2 text-sm text-white/60 mb-6">
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span>Tiếp theo: {course.nextLesson}</span>
          </div>

          {/* Progress */}
          <div className="max-w-xs">
            <div className="flex justify-between text-xs text-white/60 mb-1.5">
              <span>{course.completedLessons}/{course.totalLessons} bài học</span>
              <span className="text-white font-semibold">{course.progress}%</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-400 rounded-full transition-all duration-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex-shrink-0 flex flex-col items-end justify-between h-full">
          <Link
            href={`/courses/${course.slug}`}
            className="flex items-center gap-2 px-5 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-sm whitespace-nowrap"
          >
            Tiếp tục học ngay
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
