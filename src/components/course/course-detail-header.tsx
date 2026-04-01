"use client";

/**
 * CourseDetailHeader - blue gradient header for the course detail page
 * Shows breadcrumb, title, description, badges (bestseller, rating, etc.)
 */

import Link from "next/link";
import { Star, Award, Globe, RefreshCw } from "lucide-react";
import { CourseDetail } from "@/types/course";

interface CourseDetailHeaderProps {
  course: CourseDetail;
}

export function CourseDetailHeader({ course }: CourseDetailHeaderProps) {
  const discountPct =
    course.originalPrice && course.originalPrice > course.price
      ? Math.round((1 - course.price / course.originalPrice) * 100)
      : 0;

  // Format updatedAt to readable Vietnamese date
  const updatedLabel = course.updatedAt
    ? new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(
        new Date(course.updatedAt)
      )
    : null;

  return (
    <div className="bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 text-white">
      <div className="container mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-1.5 text-sm text-white/70">
          <Link href="/" className="hover:text-white transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-white transition-colors">
            Khóa học
          </Link>
          <span>/</span>
          <span className="text-white/90">{course.category.name}</span>
        </nav>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-bold leading-tight md:text-4xl">
          {course.title}
        </h1>

        {/* Description */}
        <p className="mb-5 max-w-3xl text-base text-white/85 line-clamp-2">
          {course.description}
        </p>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-3">
          {discountPct >= 20 && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-yellow-900">
              <Award className="h-3.5 w-3.5" />
              Bestseller
            </span>
          )}

          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-bold">{course.rating.toFixed(1)}</span>
            <span className="text-white/70">
              ({course.reviewCount.toLocaleString()} đánh giá)
            </span>
          </div>

          <span className="text-white/60">•</span>
          <span className="text-white/80">
            {course.studentCount.toLocaleString()} học viên
          </span>

          {updatedLabel && (
            <>
              <span className="text-white/60">•</span>
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Cập nhật {updatedLabel}</span>
              </div>
            </>
          )}

          <span className="text-white/60">•</span>
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <Globe className="h-3.5 w-3.5" />
            <span>{course.language}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
