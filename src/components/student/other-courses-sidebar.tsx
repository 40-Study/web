"use client";

import Link from "next/link";
import Image from "next/image";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { EnrolledCourse } from "@/types/course";

interface OtherCoursesSidebarProps {
  courses: EnrolledCourse[];
  maxItems?: number;
}

export function OtherCoursesSidebar({ courses, maxItems = 3 }: OtherCoursesSidebarProps) {
  const displayCourses = courses.slice(0, maxItems);

  if (displayCourses.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
          Đang học khác
        </h3>
        <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
          {String(courses.length).padStart(2, "0")}
        </span>
      </div>

      {/* Course list */}
      <div className="space-y-4">
        {displayCourses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}/learn`}
            className="flex items-center gap-3 group"
          >
            {/* Thumbnail */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              {course.thumbnail ? (
                <Image
                  src={course.thumbnail}
                  alt=""
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                  {course.title.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                {course.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 uppercase">Tiến độ</span>
                <span className="text-xs font-medium text-gray-700">{course.progress}%</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
