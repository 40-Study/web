"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useCreateReview } from "@/hooks/queries/use-reviews";
import type { ReviewListResponse } from "@/services/review.service";

function Stars({ value, size = "w-4 h-4" }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(size, star <= Math.round(value) ? "text-yellow-400 fill-yellow-400" : "text-gray-300")}
        />
      ))}
    </div>
  );
}

function formatReviewDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
}

interface LessonReviewsPanelProps {
  courseId: string;
  data: ReviewListResponse | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Tab "Đánh giá" trong trang học — A5, QA vòng 2 (N7).
 *
 * Trước đây tab hiện `course.total_reviews` ghi cứng từ seed (vd "318 đánh
 * giá") với danh sách rỗng và không có chỗ viết. Nay đọc số liệu + danh sách
 * THẬT từ `GET /courses/:id/reviews` và cho học viên viết đánh giá qua
 * `POST /courses/:id/reviews`.
 */
export function LessonReviewsPanel({ courseId, data, isLoading, isError }: LessonReviewsPanelProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const createReview = useCreateReview(courseId);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
      </div>
    );
  }
  if (isError) {
    return <p className="text-sm text-red-500 py-4">Không tải được đánh giá. Vui lòng thử lại sau.</p>;
  }

  const reviews = data?.data ?? [];
  const total = data?.total ?? 0;
  const average = Number(data?.average_rating ?? 0);
  const alreadyReviewed = !!userId && reviews.some((r) => r.user_id === userId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return;
    createReview.mutate(
      { rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          setRating(0);
          setComment("");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        {total > 0 ? (
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900">{average.toFixed(1)}</p>
            <Stars value={average} />
            <p className="text-xs text-gray-500 mt-1">{total} đánh giá</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Khoá học chưa có đánh giá nào.</p>
        )}
      </div>

      {alreadyReviewed ? (
        <p className="text-sm text-gray-500">Bạn đã đánh giá khoá học này. Cảm ơn bạn!</p>
      ) : (
        <form onSubmit={submit} className="space-y-3 border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900">Viết đánh giá của bạn</p>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Chọn số sao">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} sao`}
                onClick={() => setRating(star)}
                className="p-0.5"
              >
                <Star
                  className={cn("w-6 h-6", star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Chia sẻ cảm nhận của bạn về khoá học (không bắt buộc)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          <button
            type="submit"
            disabled={rating < 1 || createReview.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createReview.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Gửi đánh giá
          </button>
        </form>
      )}

      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
              {(review.user_name || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{review.user_name || "Học viên"}</p>
              <div className="flex items-center gap-2">
                <Stars value={review.rating} />
                <span className="text-xs text-gray-400">{formatReviewDate(review.created_at)}</span>
              </div>
            </div>
          </div>
          {review.comment ? <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p> : null}
        </div>
      ))}
    </div>
  );
}
