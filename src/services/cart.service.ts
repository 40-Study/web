/**
 * Cart service
 * Endpoints: /cart
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  course_id: string;
  course?: {
    id: string;
    title: string;
    /** Giá niêm yết. */
    price: number | string;
    /**
     * GIÁ BÁN khi đang giảm giá (backend CartCourseInfoDTO.discount_price). Giá phải trả =
     * `getCartItemPrices(item).price` (lib/cart-pricing.ts) — không tự chọn giữa price/discount_price.
     */
    discount_price?: number | string | null;
    thumbnail?: string;
    instructor?: { id: string; name: string };
    /** Tên trường THẬT của backend (CartCourseInfoDTO); `normalizeCartItem` đổ sang `thumbnail`/`instructor`. */
    thumbnail_url?: string;
    instructor_name?: string;
  };
  added_at?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  /**
   * Số lượng item trong giỏ. Trường backend (`CartListResponseDTO.TotalItem`) serialize
   * ra JSON là `total_item` — KHÔNG phải `item_count`. Đọc sai tên khiến badge header và
   * "Giỏ hàng (0)" luôn bằng 0 dù giỏ có hàng (QA S1).
   */
  total_item: number;
}

type R<T> = { message: string; data: T };

/**
 * Backend gửi `thumbnail_url` + `instructor_name` (dto/cartDTO.go), còn UI đọc `course.thumbnail` +
 * `course.instructor.name` nên thumbnail luôn là ảnh giữ chỗ và mất tên giảng viên (QA3 Q10). Chuẩn hoá một lần
 * ở service để giỏ, checkout và dropdown header cùng đúng.
 */
export function normalizeCartItem(item: CartItem): CartItem {
  const course = item.course;
  if (!course) return item;
  return {
    ...item,
    course: {
      ...course,
      thumbnail: course.thumbnail || course.thumbnail_url || undefined,
      instructor: course.instructor ?? (course.instructor_name ? { id: "", name: course.instructor_name } : undefined),
    },
  };
}

const normalizeCart = (cart: Cart): Cart => ({ ...cart, items: (cart.items ?? []).map(normalizeCartItem) });

// ─── Service ────────────────────────────────────────────────────────────────

export const cartService = {
  /** GET /cart */
  getCart: () =>
    api.get<R<Cart>>("/cart").then((r) => normalizeCart(r.data.data)),

  /** POST /cart { course_id } */
  addToCart: (courseId: string) =>
    api.post<R<CartItem>>("/cart", { course_id: courseId }).then((r) => normalizeCartItem(r.data.data)),

  /** GET /cart/check/:courseId */
  isInCart: (courseId: string) =>
    api.get<R<{ in_cart: boolean }>>(`/cart/check/${courseId}`).then((r) => r.data.data.in_cart),

  /** DELETE /cart { course_ids } — remove specific courses */
  removeFromCart: (courseIds: string[]) =>
    api.delete<R<null>>("/cart", { data: { course_ids: courseIds } }).then((r) => r.data),

  /** DELETE /cart/clear — remove all items */
  clearCart: () =>
    api.delete<R<null>>("/cart/clear").then((r) => r.data),
};
