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
    price: number;
    thumbnail?: string;
    instructor?: { id: string; name: string };
  };
  added_at?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const cartService = {
  /** GET /cart/ */
  getCart: () =>
    api.get<R<Cart>>("/cart/").then((r) => r.data.data),

  /** POST /cart/ { course_id } */
  addToCart: (courseId: string) =>
    api.post<R<CartItem>>("/cart/", { course_id: courseId }).then((r) => r.data.data),

  /** GET /cart/check/:courseId */
  isInCart: (courseId: string) =>
    api.get<R<{ in_cart: boolean }>>(`/cart/check/${courseId}`).then((r) => r.data.data.in_cart),

  /** DELETE /cart/ { course_ids } — remove specific courses */
  removeFromCart: (courseIds: string[]) =>
    api.delete<R<null>>("/cart/", { data: { course_ids: courseIds } }).then((r) => r.data),

  /** DELETE /cart/clear — remove all items */
  clearCart: () =>
    api.delete<R<null>>("/cart/clear").then((r) => r.data),
};
