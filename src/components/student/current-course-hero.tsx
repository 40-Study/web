"use client";

import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { EnrolledCourse } from "@/types/course";

interface CurrentCourseHeroProps {
  course: EnrolledCourse;
  currentChapter?: string;
  nextLessonTitle?: string;
}

export function CurrentCourseHero({
  course,
  currentChapter,
  nextLessonTitle,
}: CurrentCourseHeroProps) {
  const completedLessons = Math.round((course.progress / 100) * course.totalLessons);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-lg">
      {/* Background image with overlay */}
      {course.thumbnail && (
        <div className="absolute inset-0">
          <Image
            src={course.thumbnail}
            alt=""
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative p-6 md:p-8">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {course.category && (
            <Badge variant="secondary" className="bg-gray-700/80 text-gray-200 border-0">
              {course.category.name}
            </Badge>
          )}
          {currentChapter && (
            <Badge className="bg-primary-600 text-white border-0">
              {currentChapter}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold text-white mb-3 max-w-xl">
          {course.title}
        </h2>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-gray-300 mb-6 max-w-lg line-clamp-2">
            {course.description}
          </p>
        )}

        {/* Progress section */}
        <div className="bg-white rounded-xl p-4 md:p-5 max-w-2xl flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Tiến độ khóa học: {course.progress}%</span>
              <span className="text-sm font-semibold text-primary-600">
                {completedLessons} / {course.totalLessons} bài học
              </span>
            </div>
            <ProgressBar value={course.progress} variant="course" className="mb-2" />
            {nextLessonTitle && (
              <p className="text-xs text-gray-500">
                Bài học tiếp theo: &quot;{nextLessonTitle}&quot;
              </p>
            )}
          </div>

          <Link
            href={`/courses/${course.slug}/learn`}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            Tiếp tục học ngay
            <Play className="w-4 h-4 fill-current" />
          </Link>
        </div>
      </div>
    </div>
  );
}
