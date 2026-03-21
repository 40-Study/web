"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { CurrentCourse } from "@/lib/mock-data/student-dashboard";

interface ResumeBannerProps {
  course: CurrentCourse;
}

export function ResumeBanner({ course }: ResumeBannerProps) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <div className="flex gap-8">
        {/* Left: Course Info */}
        <div className="flex-1">
          <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full mb-4">
            KHÓA HỌC ĐANG HỌC
          </span>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {course.title}{" "}
            <span className="text-primary-500">{course.highlightedText}</span>
          </h2>

          <p className="text-gray-600">{course.chapter}</p>
        </div>

        {/* Right: Progress */}
        <div className="w-80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Tiến độ khóa học</span>
            <span className="text-sm font-semibold text-primary-600">
              {course.progress}%
            </span>
          </div>

          <ProgressBar value={course.progress} variant="course" className="mb-4" />

          <Link
            href={`/learn/${course.id}`}
            className="flex items-center justify-center gap-2 w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
          >
            Tiếp tục
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
