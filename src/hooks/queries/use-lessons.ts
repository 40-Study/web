/**
 * React Query hooks for lesson operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { lessonService } from "@/services/lesson.service";
import type { CreateLessonDTO, UpdateLessonDTO } from "@/types/lesson";

export const lessonKeys = {
  all: ["lessons"] as const,
  bySection: (courseId: string, sectionId: string) =>
    [...lessonKeys.all, "section", courseId, sectionId] as const,
  detail: (id: string) => [...lessonKeys.all, "detail", id] as const,
};

/** Fetch all lessons in a section */
export function useLessons(courseId: string, sectionId: string) {
  return useQuery({
    queryKey: lessonKeys.bySection(courseId, sectionId),
    queryFn: () => lessonService.getLessons(sectionId),
    enabled: !!courseId && !!sectionId,
    staleTime: 30 * 1000, // 30s - avoid refetch on every mount
  });
}

/** Fetch a single lesson by ID */
export function useLesson(id: string) {
  return useQuery({
    queryKey: lessonKeys.detail(id),
    queryFn: () => lessonService.getLesson(id),
    enabled: !!id,
  });
}

/** Create a lesson in a section */
export function useCreateLesson(courseId: string, sectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLessonDTO) =>
      lessonService.createLesson(sectionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonKeys.bySection(courseId, sectionId) });
      toast.success("Đã tạo bài học");
    },
    onError: () => toast.error("Không thể tạo bài học"),
  });
}

/** Update a lesson */
export function useUpdateLesson(courseId: string, sectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLessonDTO }) =>
      lessonService.updateLesson(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: lessonKeys.bySection(courseId, sectionId) });
      qc.invalidateQueries({ queryKey: lessonKeys.detail(id) });
      toast.success("Đã cập nhật bài học");
    },
    onError: () => toast.error("Không thể cập nhật bài học"),
  });
}

/** Delete a lesson */
export function useDeleteLesson(courseId: string, sectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lessonService.deleteLesson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonKeys.bySection(courseId, sectionId) });
      toast.success("Đã xóa bài học");
    },
    onError: () => toast.error("Không thể xóa bài học"),
  });
}

/** Reorder lessons within a section */
export function useReorderLessons(courseId: string, sectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: string; display_order: number }[]) =>
      lessonService.reorderLessons(sectionId, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonKeys.bySection(courseId, sectionId) });
    },
    onError: () => toast.error("Không thể sắp xếp lại bài học"),
  });
}
