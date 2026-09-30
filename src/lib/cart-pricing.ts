/**
 * Giá hiển thị/cộng của dòng giỏ hàng. Backend cart trả `course.price` (niêm yết) và
 * `course.discount_price` (giá bán) rồi tính `total` theo `Course.EffectivePrice`; cộng client-side
 * (chọn một phần giỏ, checkout, cập nhật lạc quan) phải dùng cùng quy tắc — xem `course-pricing.ts`.
 */

import { resolveEffectivePrice, type PriceInput, type ResolvedPrices } from "./course-pricing";

/** Phần của CartItem mà việc tính giá cần — structural để không kéo `services/` vào `lib/`. */
export interface PricedCartItem {
  course?: { price?: PriceInput; discount_price?: PriceInput } | null;
}

export function getCartItemPrices(item: PricedCartItem): ResolvedPrices {
  return resolveEffectivePrice(item.course?.price, item.course?.discount_price);
}

/** Tổng giá phải trả (giá bán) của các dòng giỏ hàng. */
export function sumCartItemPrices(items: readonly PricedCartItem[]): number {
  return items.reduce((sum, item) => sum + getCartItemPrices(item).price, 0);
}
