/**
 * React Query hooks for course section operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sectionService } from "@/services/section.service";
import type { CreateSectionDTO, UpdateSectionDTO } from "@/types/section";

export const sectionKeys = {
  all: ["sections"] as const,
  byCourse: (courseId: string) => [...sectionKeys.all, "course", courseId] as const,
  detail: (courseId: string, id: string) =>
    [...sectionKeys.byCourse(courseId), id] as const,
};

/** Fetch all sections for a course */
export function useSections(courseId: string) {
  return useQuery({
    queryKey: sectionKeys.byCourse(courseId),
    queryFn: () => sectionService.getSections(courseId),
    enabled: !!courseId,
    staleTime: 30 * 1000, // 30s - avoid refetch on every mount
  });
}

/** Create a new section */
export function useCreateSection(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSectionDTO) => sectionService.createSection(courseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sectionKeys.byCourse(courseId) });
      toast.success("Đã tạo phần học");
    },
    onError: () => toast.error("Không thể tạo phần học"),
  });
}

/** Update an existing section */
export function useUpdateSection(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSectionDTO }) =>
      sectionService.updateSection(courseId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sectionKeys.byCourse(courseId) });
      toast.success("Đã cập nhật phần học");
    },
    onError: () => toast.error("Không thể cập nhật phần học"),
  });
}

/** Delete a section */
export function useDeleteSection(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sectionService.deleteSection(courseId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sectionKeys.byCourse(courseId) });
      toast.success("Đã xóa phần học");
    },
    onError: () => toast.error("Không thể xóa phần học"),
  });
}

/** Reorder sections within a course */
export function useReorderSections(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: string; display_order: number }[]) =>
      sectionService.reorderSections(courseId, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sectionKeys.byCourse(courseId) });
    },
    onError: () => toast.error("Không thể sắp xếp lại phần học"),
  });
}
