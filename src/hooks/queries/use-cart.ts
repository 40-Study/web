/**
 * React Query hooks for cart operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cartService } from "@/services/cart.service";

export const cartKeys = {
  all: ["cart"] as const,
  detail: () => [...cartKeys.all, "detail"] as const,
  check: (courseId: string) => [...cartKeys.all, "check", courseId] as const,
};

/** Fetch current user's cart */
export function useCart() {
  return useQuery({
    queryKey: cartKeys.detail(),
    queryFn: () => cartService.getCart(),
  });
}

/** Check if a course is in the cart */
export function useIsInCart(courseId: string) {
  return useQuery({
    queryKey: cartKeys.check(courseId),
    queryFn: () => cartService.isInCart(courseId),
    enabled: !!courseId,
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
    onError: () => {
      toast.error("Không thể thêm vào giỏ hàng");
    },
  });
}

/** Remove a course from cart */
export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => cartService.removeFromCart([courseId]),
    onSuccess: (_, courseId) => {
      qc.invalidateQueries({ queryKey: cartKeys.detail() });
      qc.invalidateQueries({ queryKey: cartKeys.check(courseId) });
      toast.success("Đã xóa khỏi giỏ hàng");
    },
    onError: () => {
      toast.error("Không thể xóa khỏi giỏ hàng");
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
      toast.success("Đã xóa toàn bộ giỏ hàng");
    },
    onError: () => {
      toast.error("Không thể xóa giỏ hàng");
    },
  });
}
