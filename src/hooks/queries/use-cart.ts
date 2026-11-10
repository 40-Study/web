/**
 * React Query hooks for cart operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-messages";
import { cartService, type Cart } from "@/services/cart.service";
import { sumCartItemPrices } from "@/lib/cart-pricing";
import { useAuthStore } from "@/stores/auth.store";

export const cartKeys = {
  all: ["cart"] as const,
  detail: () => [...cartKeys.all, "detail"] as const,
  check: (courseId: string) => [...cartKeys.all, "check", courseId] as const,
};

/** Fetch current user's cart */
export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: cartKeys.detail(),
    queryFn: () => cartService.getCart(),
    enabled: isAuthenticated,
  });
}

/** Check if a course is in the cart */
export function useIsInCart(courseId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: cartKeys.check(courseId),
    queryFn: () => cartService.isInCart(courseId),
    enabled: isAuthenticated && !!courseId,
  });
}

/** Add a course to cart */
export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => cartService.addToCart(courseId),
    onSuccess: (_, courseId) => {
      qc.invalidateQueries({ queryKey: cartKeys.detail() });
      qc.invalidateQueries({ queryKey: cartKeys.check(courseId) });
      toast.success("Đã thêm vào giỏ hàng");
    },
    onError: (error) => {
      // 409 COURSE_NOT_FOR_SALE (khoá đã ngừng bán) nói rõ lý do; lỗi khác giữ câu chung.
      toast.error(getErrorMessage(error, "Không thể thêm vào giỏ hàng"));
    },
  });
}

/**
 * Remove a course from cart.
 *
 * QA-A-12: trước đây chỉ invalidate sau khi DELETE trả 200, nên trên mạng/server chậm dòng đã xoá còn nằm đó
 * vài giây (kèm "Thanh toán (1)") như thể bấm Xoá không ăn. Nay bỏ dòng khỏi cache NGAY (cập nhật lạc quan);
 * request lỗi thì trả lại đúng giỏ cũ và báo lỗi; xong xuôi vẫn refetch để khớp server.
 */
export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => cartService.removeFromCart([courseId]),
    onMutate: async (courseId: string) => {
      // Huỷ refetch đang chạy để nó không ghi đè giỏ đã bỏ dòng bằng dữ liệu cũ.
      await qc.cancelQueries({ queryKey: cartKeys.detail() });
      const previous = qc.getQueryData<Cart>(cartKeys.detail());
      if (previous) {
        const items = previous.items.filter((item) => item.course_id !== courseId);
        qc.setQueryData<Cart>(cartKeys.detail(), {
          ...previous,
          items,
          total_item: items.length,
          total: sumCartItemPrices(items),
        });
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success("Đã xoá khỏi giỏ hàng");
    },
    onError: (_error, _courseId, context) => {
      if (context?.previous) qc.setQueryData(cartKeys.detail(), context.previous);
      toast.error("Không thể xoá khỏi giỏ hàng");
    },
    onSettled: (_data, _error, courseId) => {
      qc.invalidateQueries({ queryKey: cartKeys.detail() });
      qc.invalidateQueries({ queryKey: cartKeys.check(courseId) });
    },
  });
}

/** Clear all items from cart */
export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cartService.clearCart(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartKeys.all });
      toast.success("Đã xoá toàn bộ giỏ hàng");
    },
    onError: () => {
      toast.error("Không thể xoá giỏ hàng");
    },
  });
}
