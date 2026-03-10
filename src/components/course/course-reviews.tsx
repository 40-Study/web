"use client";

import { Star } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Review } from "@/types/course";

interface CourseReviewsProps {
  rating: number;
  reviewCount: number;
  reviews: Review[];
  ratingDistribution: Record<number, number>;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          )}
        />
      ))}
    </div>
  );
}

export function CourseReviews({
  rating,
  reviewCount,
  reviews,
  ratingDistribution,
  className,
  onLoadMore,
  hasMore = false,
}: CourseReviewsProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <h2 className="text-xl font-semibold">Đánh giá từ học viên</h2>

      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-4 bg-muted/50 rounded-lg">
        {/* Overall Rating */}
        <div className="text-center">
          <p className="text-5xl font-bold">{rating.toFixed(1)}</p>
          <StarRating rating={rating} size="md" />
          <p className="text-sm text-muted-foreground mt-1">
            {reviewCount} đánh giá
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 w-full md:w-auto space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const percentage = ratingDistribution[star] || 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-sm w-3">{star}</span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-10 text-right">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="p-4">
            <div className="flex items-start gap-3">
              <img
                src={review.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user.name}`}
                alt={review.user.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-medium">{review.user.name}</p>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <StarRating rating={review.rating} />
                <p className="text-sm mt-2 leading-relaxed">{review.content}</p>
                {review.helpful !== undefined && review.helpful > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {review.helpful} người thấy hữu ích
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {hasMore && onLoadMore && (
        <Button variant="outline" className="w-full" onClick={onLoadMore}>
          Xem thêm đánh giá
        </Button>
      )}

      {reviews.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          Chưa có đánh giá nào
        </p>
      )}
    </div>
  );
}
