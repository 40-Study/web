/**
 * React Query hooks for category and tag admin CRUD operations.
 * Note: useCategories (read-only, mapped) lives in src/hooks/use-courses.ts.
 * These hooks use categoryService directly for full admin CRUD + tags.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoryService } from "@/services/category.service";
import type { CreateCategoryDTO, UpdateCategoryDTO } from "@/services/category.service";

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
  detail: (id: string) => [...categoryKeys.all, "detail", id] as const,
  tags: ["tags"] as const,
};

/** Fetch all categories */
export function useCategoryList() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => categoryService.getAll(),
  });
}

/** Fetch a single category by ID */
export function useCategoryDetail(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoryService.getById(id),
    enabled: !!id,
  });
}

/** Create a category (admin) */
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryDTO) => categoryService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success("Đã tạo danh mục");
    },
    onError: () => toast.error("Không thể tạo danh mục"),
  });
}

/** Update a category (admin) */
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDTO }) =>
      categoryService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      qc.invalidateQueries({ queryKey: categoryKeys.detail(id) });
      toast.success("Đã cập nhật danh mục");
    },
    onError: () => toast.error("Không thể cập nhật danh mục"),
  });
}

/** Delete a category (admin) */
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success("Đã xóa danh mục");
    },
    onError: () => toast.error("Không thể xóa danh mục"),
  });
}

// ─── Tag hooks ────────────────────────────────────────────────────────────────

/** Fetch all tags */
export function useTags() {
  return useQuery({
    queryKey: categoryKeys.tags,
    queryFn: () => categoryService.getAllTags(),
  });
}

/** Create a tag (admin) */
export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => categoryService.createTag(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.tags });
      toast.success("Đã tạo thẻ");
    },
    onError: () => toast.error("Không thể tạo thẻ"),
  });
}

/** Delete a tag (admin) */
export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryService.deleteTag(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.tags });
      toast.success("Đã xóa thẻ");
    },
    onError: () => toast.error("Không thể xóa thẻ"),
  });
}
