"use client";

/**
 * CourseDetailContent - left column of the course detail page
 * Sections: learning outcomes, syllabus, requirements, instructor
 */

import { Check } from "lucide-react";
import { CourseSyllabus } from "@/components/course/course-syllabus";
import { InstructorCard } from "@/components/course/instructor-card";
import { CourseReviews } from "@/components/course/course-reviews";
import { CourseDetail, Review as DisplayReview } from "@/types/course";
import type { Review as ApiReview, ReviewListResponse } from "@/services/review.service";

interface CourseDetailContentProps {
  course: CourseDetail;
  isEnrolled: boolean;
  courseSlug: string;
  /** GET /courses/:id/reviews — undefined khi đang tải hoặc chưa có courseId. */
  reviewsData?: ReviewListResponse;
}

/** API Review (phẳng: user_name/avatar_url) -> shape CourseReviews đang render (user lồng nhau, content, createdAt...). */
function mapApiReviewsToDisplay(reviews: ApiReview[]): DisplayReview[] {
  return reviews.map((r) => ({
    id: r.id,
    user: {
      id: r.user_id,
      name: r.user_name || "Học viên",
      avatar: r.avatar_url,
    },
    rating: r.rating,
    content: r.comment ?? "",
    createdAt: r.created_at ?? "",
    helpful: r.helpful_count,
  }));
}

/** rating_counts là SỐ LƯỢNG review/mức sao — CourseReviews cần PHẦN TRĂM để vẽ thanh phân bố. */
function toRatingPercentages(
  counts: Record<number, number> | undefined,
  total: number
): Record<number, number> {
  if (!counts || total <= 0) return {};
  const result: Record<number, number> = {};
  for (const star of [1, 2, 3, 4, 5]) {
    result[star] = Math.round(((counts[star] ?? 0) / total) * 100);
  }
  return result;
}

export function CourseDetailContent({
  course,
  isEnrolled,
  courseSlug,
  reviewsData,
}: CourseDetailContentProps) {
  return (
    <div className="space-y-8">
      {/* What you'll learn */}
      {course.learningOutcomes.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Bạn sẽ học được gì
          </h2>
          <div className="grid gap-3 rounded-2xl border border-green-100 bg-green-50/50 p-5 sm:grid-cols-2">
            {course.learningOutcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span className="text-sm text-gray-700">{outcome}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Course syllabus */}
      <section>
        <CourseSyllabus
          sections={course.sections}
          isEnrolled={isEnrolled}
          courseSlug={courseSlug}
          showTrialLinks={!isEnrolled && course.price > 0}
        />
      </section>

      {/* Requirements */}
      {course.requirements && course.requirements.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">Yêu cầu</h2>
          <ul className="space-y-2">
            {course.requirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
                {req}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Instructor */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Giảng viên</h2>
        <InstructorCard instructor={course.instructor} />
      </section>

      {/* Reviews — số liệu + danh sách THẬT từ GET /courses/:id/reviews (public).
          Không có đánh giá nào -> CourseReviews tự hiện "Chưa có đánh giá nào"
          (QA khách+học sinh P2, 260927). */}
      <section>
        <CourseReviews
          rating={Number(reviewsData?.average_rating ?? 0)}
          reviewCount={reviewsData?.total ?? 0}
          reviews={mapApiReviewsToDisplay(reviewsData?.data ?? [])}
          ratingDistribution={toRatingPercentages(reviewsData?.rating_counts, reviewsData?.total ?? 0)}
        />
      </section>
    </div>
  );
}
