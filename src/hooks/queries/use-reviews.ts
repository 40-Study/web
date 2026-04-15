import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reviewService, CreateReviewDTO, UpdateReviewDTO } from "@/services/review.service";

// ─── Query keys ────────────────────────────────────────────────────────────

export const reviewKeys = {
  all: ["reviews"] as const,
  list: (courseId: string) => [...reviewKeys.all, "list", courseId] as const,
};

// ─── Queries ───────────────────────────────────────────────────────────────

export function useCourseReviews(courseId: string, params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: [...reviewKeys.list(courseId), params],
    queryFn: () => reviewService.list(courseId, params),
    enabled: !!courseId,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────

export function useCreateReview(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewDTO) => reviewService.create(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(courseId) });
      toast.success("Đã gửi đánh giá");
    },
    onError: () => {
      toast.error("Không thể gửi đánh giá");
    },
  });
}

export function useUpdateReview(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; data: UpdateReviewDTO }) =>
      reviewService.update(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(courseId) });
      toast.success("Đã cập nhật đánh giá");
    },
    onError: () => {
      toast.error("Không thể cập nhật đánh giá");
    },
  });
}

export function useDeleteReview(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => reviewService.delete(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(courseId) });
      toast.success("Đã xóa đánh giá");
    },
    onError: () => {
      toast.error("Không thể xóa đánh giá");
    },
  });
}

export function useReviewReaction(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      action,
      reactionType,
    }: {
      reviewId: string;
      action: "add" | "remove";
      reactionType?: "helpful" | "not_helpful";
    }) =>
      action === "add" && reactionType
        ? reviewService.addReaction(reviewId, { reaction_type: reactionType })
        : reviewService.removeReaction(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(courseId) });
    },
  });
}
