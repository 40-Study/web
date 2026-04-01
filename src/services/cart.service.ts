/**
 * Cart service — real API calls for cart management
 */

import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartCourse {
  id: string;
  title: string;
  price: number;
  thumbnail?: string;
  instructor?: { id: string; name: string };
}

export interface CartItem {
  id: string;
  course_id: string;
  course: CartCourse;
  added_at: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const cartService = {
  /**
   * GET /cart — fetch current user's cart
   */
  getCart: () =>
    api
      .get<{ message: string; data: Cart }>("/cart")
      .then((r) => r.data.data),

  /**
   * POST /cart { course_id } — add a course to cart
   */
  addToCart: (courseId: string) =>
    api
      .post<{ message: string; data: CartItem }>("/cart", { course_id: courseId })
      .then((r) => r.data.data),

  /**
   * DELETE /cart { course_id } — remove a course from cart
   */
  removeFromCart: (courseId: string) =>
    api
      .delete<{ message: string }>("/cart", { data: { course_id: courseId } })
      .then((r) => r.data),

  /**
   * DELETE /cart/clear — remove all items from cart
   */
  clearCart: () =>
    api
      .delete<{ message: string }>("/cart/clear")
      .then((r) => r.data),

  /**
   * GET /cart/check/:courseId — check if course is in cart
   */
  isInCart: (courseId: string) =>
    api
      .get<{ message: string; data: { in_cart: boolean } }>(`/cart/check/${courseId}`)
      .then((r) => r.data.data.in_cart),
};
