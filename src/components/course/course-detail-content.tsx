"use client";

/**
 * CourseDetailContent - left column of the course detail page
 * Sections: learning outcomes, syllabus, requirements, instructor
 */

import { Check } from "lucide-react";
import { CourseSyllabus } from "@/components/course/course-syllabus";
import { InstructorCard } from "@/components/course/instructor-card";
import { CourseReviews } from "@/components/course/course-reviews";
import { Button } from "@/components/ui/button";
import { CourseDetail, Review as DisplayReview } from "@/types/course";
import type { Review as ApiReview, ReviewListResponse } from "@/services/review.service";

interface CourseDetailContentProps {
  course: CourseDetail;
  isEnrolled: boolean;
  courseSlug: string;
  /** GET /courses/:id/reviews — undefined khi đang tải hoặc chưa có courseId. */
  reviewsData?: ReviewListResponse;
  /**
   * QA-A-02: trước đây `reviewsData` chưa có thì khối này hiện "0.0 / Chưa có đánh giá nào" — đọc thành
   * "khoá không ai đánh giá" trong khi request chỉ đang chạy (hoặc đã lỗi). Mặc định "loading".
   */
  reviewsState?: "loading" | "ready" | "error";
  onRetryReviews?: () => void;
}

function ReviewsPlaceholder({ state, onRetry }: { state: "loading" | "error"; onRetry?: () => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Đánh giá từ học viên</h2>
      {state === "loading" ? (
        <div role="status" aria-label="Đang tải đánh giá" className="animate-pulse space-y-3">
          <div className="h-24 rounded-lg bg-muted" />
          <div className="h-16 rounded-lg bg-muted" />
        </div>
      ) : (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <span>Chưa tải được đánh giá của khoá học.</span>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Thử lại
            </Button>
          )}
        </div>
      )}
    </div>
  );
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
  reviewsState = "loading",
  onRetryReviews,
}: CourseDetailContentProps) {
  return (
    <div className="space-y-8">
      {/* What you'll learn */}
      {course.learningOutcomes.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Bạn sẽ học được gì
          </h2>
          <div className="grid gap-3 rounded-2xl border border-green-100 bg-green-50/50 p-5 sm:grid-cols-2 dark:border-green-500/30">
            {course.learningOutcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                <span className="text-sm text-foreground">{outcome}</span>
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
          <h2 className="mb-3 text-xl font-semibold text-foreground">Yêu cầu</h2>
          <ul className="space-y-2">
            {course.requirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground" />
                {req}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Instructor */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Giảng viên</h2>
        <InstructorCard instructor={course.instructor} />
      </section>

      {/* Reviews — số liệu + danh sách THẬT từ GET /courses/:id/reviews (public).
          Không có đánh giá nào -> CourseReviews tự hiện "Chưa có đánh giá nào"
          (QA khách+học sinh P2, 260927). */}
      <section>
        {reviewsData && reviewsState === "ready" ? (
          <CourseReviews
            rating={Number(reviewsData.average_rating ?? 0)}
            reviewCount={reviewsData.total ?? 0}
            reviews={mapApiReviewsToDisplay(reviewsData.data ?? [])}
            ratingDistribution={toRatingPercentages(reviewsData.rating_counts, reviewsData.total ?? 0)}
          />
        ) : (
          <ReviewsPlaceholder state={reviewsState === "error" ? "error" : "loading"} onRetry={onRetryReviews} />
        )}
      </section>
    </div>
  );
}
