"use client";

import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { EnrolledCourse } from "@/lib/mock-data/my-courses";

interface EnrolledCourseCardProps {
  course: EnrolledCourse;
}

const categoryColors: Record<string, string> = {
  FRONTEND: "bg-blue-100 text-blue-700",
  BACKEND: "bg-green-100 text-green-700",
  DEVOPS: "bg-purple-100 text-purple-700",
  DATABASE: "bg-orange-100 text-orange-700",
  CLOUD: "bg-cyan-100 text-cyan-700",
};

export function EnrolledCourseCard({ course }: EnrolledCourseCardProps) {
  const colorClass = categoryColors[course.category] ?? "bg-gray-100 text-gray-700";
  const isCompleted = course.progress >= 100;

  return (
    <Link
      href={`/learn/${course.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow block"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-blue-600 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="w-16 h-16 border-4 border-white rounded-full" />
        </div>
        {/* Progress overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Category + status badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
            {course.category}
          </span>
          {isCompleted && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              HOÀN THÀNH
            </span>
          )}
          {!isCompleted && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-600">
              ĐÃ ĐĂNG KÝ
            </span>
          )}
        </div>

        <h4 className="font-semibold text-gray-900 text-sm leading-snug mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {course.title}
        </h4>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Tiến độ</span>
            <span className="font-medium text-gray-700">{course.progress}%</span>
          </div>
          <ProgressBar value={course.progress} variant="course" size="sm" />
        </div>
      </div>
    </Link>
  );
}
