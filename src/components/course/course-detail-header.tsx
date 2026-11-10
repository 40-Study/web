"use client";

/**
 * CourseDetailHeader - blue gradient header for the course detail page
 * Shows breadcrumb, title, description, badges (discount, rating, etc.)
 */

import Link from "next/link";
import { Star, Tag, Globe, RefreshCw } from "lucide-react";
import { CourseDetail } from "@/types/course";
import { WishlistButton } from "@/components/course/wishlist-button";
import type { CourseRatingSummary } from "@/components/course/course-rating-summary";

interface CourseDetailHeaderProps {
  course: CourseDetail;
  /**
   * Số liệu đánh giá — xem course-rating-summary.ts. Không truyền thì coi như đang tải: header KHÔNG được
   * tự hiện "0.0 (0 đánh giá)" khi chưa biết số liệu (QA-A-02).
   */
  ratingSummary?: CourseRatingSummary;
  /** Đã ghi danh khoá này thì không cần nút lưu yêu thích. */
  isEnrolled?: boolean;
}

export function CourseDetailHeader({ course, ratingSummary, isEnrolled = false }: CourseDetailHeaderProps) {
  const summary: CourseRatingSummary = ratingSummary ?? { status: "loading" };
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
    <div className="bg-neutral-50" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <div className="page-container py-10">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-1.5 text-sm text-neutral-500">
          <Link href="/" className="hover:text-black transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-black transition-colors">
            Khoá học
          </Link>
          <span>/</span>
          <span className="text-neutral-700">{course.category.name}</span>
        </nav>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-light leading-tight md:text-4xl text-black">
          {course.title}
        </h1>

        {/* Description */}
        <p className="mb-5 max-w-3xl text-base text-neutral-600 line-clamp-2" style={{ letterSpacing: '0.16px' }}>
          {course.description}
        </p>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* QA-A-02: nhãn cũ "Bestseller" gắn theo mức giảm giá (khoá 1 học viên vẫn "bán chạy") — nói đúng là giảm giá. */}
          {discountPct >= 20 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              <Tag className="h-3.5 w-3.5" aria-hidden="true" />
              Giảm {discountPct}%
            </span>
          )}

          {summary.status === "loading" ? (
            <span
              role="status"
              aria-label="Đang tải đánh giá"
              data-testid="course-rating-loading"
              className="h-5 w-32 animate-pulse rounded bg-neutral-200"
            />
          ) : summary.total > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span className="font-medium text-black">{summary.average.toFixed(1)}</span>
              <span className="text-neutral-500">
                ({summary.total.toLocaleString("vi-VN")} đánh giá)
              </span>
            </div>
          ) : (
            <span className="text-neutral-500">Chưa có đánh giá</span>
          )}

          <span className="text-neutral-300">•</span>
          <span className="text-neutral-600">
            {course.studentCount.toLocaleString()} học viên
          </span>

          {updatedLabel && (
            <>
              <span className="text-neutral-300">•</span>
              <div className="flex items-center gap-1 text-neutral-600 text-sm">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Cập nhật {updatedLabel}</span>
              </div>
            </>
          )}

          <span className="text-neutral-300">•</span>
          <div className="flex items-center gap-1 text-neutral-600 text-sm">
            <Globe className="h-3.5 w-3.5" />
            <span>{course.language}</span>
          </div>
        </div>

        {/* QA2 F-10: lưu khoá vào danh sách yêu thích (trang /wishlist). */}
        {!isEnrolled && (
          <div className="mt-5">
            <WishlistButton courseId={String(course.id)} variant="button" />
          </div>
        )}
      </div>
    </div>
  );
}
