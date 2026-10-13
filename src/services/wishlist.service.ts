/**
 * Wishlist service — khoá học yêu thích của người dùng hiện tại (contract BE3 §4, QA2 F-10).
 * Endpoints: /wishlist, /wishlist/ids, /wishlist/:courseId
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Tóm tắt khoá học của wishlist (cùng dạng CartCourseInfoDTO): price/discount_price/average_rating là chuỗi decimal. */
export interface WishlistCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail_url?: string | null;
  /** Giá niêm yết. */
  price: number | string;
  /** Giá bán khi đang giảm giá (null = không giảm). Giá phải trả suy bằng `getCartItemPrices`. */
  discount_price?: number | string | null;
  level?: string;
  instructor_name?: string;
  total_duration_mins?: number;
  total_lessons?: number;
  average_rating?: number | string;
  total_students?: number;
}

export interface WishlistItem {
  id: string;
  course_id: string;
  user_id: string;
  created_at: string;
  course?: WishlistCourse;
}

export interface WishlistPage {
  items: WishlistItem[];
  total_item: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const wishlistService = {
  /** GET /wishlist — mới nhất trước; khoá đã gỡ/xoá tự biến mất khỏi danh sách. */
  list: () => api.get<R<WishlistPage>>("/wishlist").then((r) => r.data.data),

  /** GET /wishlist/ids — tra nhẹ để tô tim trên thẻ khoá học. */
  ids: () =>
    api.get<R<{ course_ids: string[] | null }>>("/wishlist/ids").then((r) => r.data.data?.course_ids ?? []),

  /** POST /wishlist { course_id } — idempotent (201 lần đầu, 200 khi đã có). */
  add: (courseId: string) =>
    api.post<R<WishlistItem>>("/wishlist", { course_id: courseId }).then((r) => r.data.data),

  /** DELETE /wishlist/:courseId — idempotent (200 kể cả khi không có trong danh sách). */
  remove: (courseId: string) => api.delete<R<null>>(`/wishlist/${courseId}`).then((r) => r.data),
};
