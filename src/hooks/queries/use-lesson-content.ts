/**
 * React Query hooks for lesson content (video, livestream, exercise)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { lessonContentService } from "@/services/lesson-content.service";
import type { CreateContentDTO, UpdateContentDTO } from "@/services/lesson-content.service";

export const lessonContentKeys = {
  all: ["lesson-content"] as const,
  contents: (lessonId: string) => [...lessonContentKeys.all, "contents", lessonId] as const,
};

/** Fetch all contents for a lesson */
export function useLessonContents(lessonId: string) {
  return useQuery({
    queryKey: lessonContentKeys.contents(lessonId),
    queryFn: () => lessonContentService.getContents(lessonId),
    enabled: !!lessonId,
    staleTime: 30 * 1000, // 30s - avoid refetch on every mount
  });
}

/** Create a new content item (video, livestream, or exercise) */
export function useCreateLessonContent(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContentDTO) => lessonContentService.createContent(lessonId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonContentKeys.contents(lessonId) });
      toast.success("Đã thêm nội dung bài học");
    },
    onError: () => toast.error("Không thể thêm nội dung"),
  });
}

/** Update an existing content item */
export function useUpdateLessonContent(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contentId, data }: { contentId: string; data: UpdateContentDTO }) =>
      lessonContentService.updateContent(lessonId, contentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonContentKeys.contents(lessonId) });
      toast.success("Đã cập nhật nội dung");
    },
    onError: () => toast.error("Không thể cập nhật nội dung"),
  });
}

/** Delete a content item */
export function useDeleteLessonContent(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contentId: string) => lessonContentService.deleteContent(lessonId, contentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonContentKeys.contents(lessonId) });
      toast.success("Đã xóa nội dung");
    },
    onError: () => toast.error("Không thể xóa nội dung"),
  });
}
