"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { EnrolledCourse } from "@/types/course";

interface EnrolledCourseCardProps {
  course: EnrolledCourse;
}

export function EnrolledCourseCard({ course }: EnrolledCourseCardProps) {
  const isEnrolled = course.progress === 0;

  return (
    <Link href={`/courses/${course.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] bg-gray-100">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
              <span className="text-4xl font-bold text-white/30">
                {course.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors mb-2">
            {course.title}
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {course.totalLessons} bài học
            </span>
            <Badge
              variant={isEnrolled ? "secondary" : "default"}
              className={
                isEnrolled
                  ? "bg-green-100 text-green-700 border-0 text-xs"
                  : "bg-primary-100 text-primary-700 border-0 text-xs"
              }
            >
              {isEnrolled ? "Đã đăng ký" : `${course.progress}%`}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
