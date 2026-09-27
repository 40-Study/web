/**
 * Review service — course reviews and reactions
 * Endpoints: /courses/:courseId/reviews, /reviews/:id
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

// Khớp backend/internal/dto/reviewDTO.go `ReviewResponseDTO` — PHẲNG
// (user_name/avatar_url), KHÔNG có object `user` lồng nhau, KHÔNG có
// `not_helpful_count` (trước đây type khai sai cả 2 điểm này; do reviews
// chưa từng render ở UI nên chưa lộ ra — QA khách+học sinh P2, 260927).
export interface Review {
  id: string;
  course_id: string;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  rating: number;
  comment?: string;
  helpful_count?: number;
  user_reaction?: "helpful" | "not_helpful" | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateReviewDTO {
  rating: number;
  comment?: string;
}

export interface UpdateReviewDTO {
  rating?: number;
  comment?: string;
}

export interface ReviewReactionDTO {
  reaction_type: "helpful" | "not_helpful";
}

export interface ReviewListResponse {
  // Khớp backend `ReviewListDTO.Data` — trước đây khai nhầm là `reviews`,
  // luôn `undefined` (QA khách+học sinh P2, 260927).
  data: Review[];
  total: number;
  page: number;
  page_size: number;
  average_rating?: number;
  /**
   * Số LƯỢNG review theo từng mức sao (1-5) — khớp
   * backend/internal/dto/reviewDTO.go `RatingCounts map[int]int64`. KHÔNG
   * phải phần trăm sẵn — quy đổi ra % ở nơi hiển thị (CourseReviews cần %).
   */
  rating_counts?: Record<number, number>;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const reviewService = {
  /** POST /courses/:courseId/reviews — create review */
  create: (courseId: string, data: CreateReviewDTO) =>
    api.post<R<Review>>(`/courses/${courseId}/reviews`, data).then((r) => r.data.data),

  /** GET /courses/:courseId/reviews — list reviews */
  list: (courseId: string, params?: { page?: number; page_size?: number }) =>
    api
      .get<R<ReviewListResponse>>(`/courses/${courseId}/reviews`, { params })
      .then((r) => r.data.data),

  /** PUT /reviews/:reviewId — update review */
  update: (reviewId: string, data: UpdateReviewDTO) =>
    api.put<R<Review>>(`/reviews/${reviewId}`, data).then((r) => r.data.data),

  /** DELETE /reviews/:reviewId — delete review */
  delete: (reviewId: string) =>
    api.delete<R<null>>(`/reviews/${reviewId}`).then((r) => r.data),

  /** POST /reviews/:reviewId/reaction — add reaction */
  addReaction: (reviewId: string, data: ReviewReactionDTO) =>
    api.post<R<null>>(`/reviews/${reviewId}/reaction`, data).then((r) => r.data),

  /** DELETE /reviews/:reviewId/reaction — remove reaction */
  removeReaction: (reviewId: string) =>
    api.delete<R<null>>(`/reviews/${reviewId}/reaction`).then((r) => r.data),
};
