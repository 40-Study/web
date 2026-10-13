/**
 * React Query hooks cho wishlist (QA2 F-10).
 * `ids` tô tim trên mọi thẻ khoá học bằng MỘT request; `list` chỉ tải ở trang /wishlist.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-messages";
import { wishlistService } from "@/services/wishlist.service";
import { useAuthStore } from "@/stores/auth.store";

export const wishlistKeys = {
  all: ["wishlist"] as const,
  list: () => [...wishlistKeys.all, "list"] as const,
  ids: () => [...wishlistKeys.all, "ids"] as const,
};

/** Danh sách khoá đã lưu (trang /wishlist). */
export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: wishlistKeys.list(),
    queryFn: () => wishlistService.list(),
    enabled: isAuthenticated,
  });
}

/** id các khoá đã lưu; `enabled` do nơi gọi quyết định (khách/phụ huynh không tải). */
export function useWishlistIds(enabled: boolean) {
  return useQuery({
    queryKey: wishlistKeys.ids(),
    queryFn: () => wishlistService.ids(),
    enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Lưu / bỏ lưu một khoá. Cập nhật lạc quan danh sách id (tim đổi ngay), lỗi thì trả về như cũ và báo lỗi;
 * xong thì làm mới cả `ids` lẫn `list` để hai nơi không lệch nhau.
 */
export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, saved }: { courseId: string; saved: boolean }) =>
      saved ? wishlistService.remove(courseId) : wishlistService.add(courseId),
    onMutate: async ({ courseId, saved }) => {
      await qc.cancelQueries({ queryKey: wishlistKeys.ids() });
      const previous = qc.getQueryData<string[]>(wishlistKeys.ids());
      qc.setQueryData<string[]>(wishlistKeys.ids(), (current = []) =>
        saved ? current.filter((id) => id !== courseId) : current.includes(courseId) ? current : [...current, courseId],
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) qc.setQueryData(wishlistKeys.ids(), context.previous);
      toast.error(getErrorMessage(error, "Không thể cập nhật danh sách yêu thích"));
    },
    onSuccess: (_data, { saved }) => {
      toast.success(saved ? "Đã bỏ khỏi yêu thích" : "Đã thêm vào yêu thích");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}
