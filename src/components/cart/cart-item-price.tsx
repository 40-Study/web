import { getCartItemPrices, type PricedCartItem } from "@/lib/cart-pricing";
import { formatCurrency } from "@/lib/utils";

/**
 * Giá của một dòng giỏ hàng: giá phải trả (khớp số tiền backend tính), kèm giá niêm yết gạch ngang
 * khi khoá đang giảm giá. Dùng chung cho dropdown giỏ hàng, trang giỏ hàng và trang thanh toán để
 * ba nơi không lệch nhau.
 */
export function CartItemPrice({ item }: { item: PricedCartItem }) {
  const { price, originalPrice } = getCartItemPrices(item);
  return (
    <>
      <span>{formatCurrency(price)}</span>
      {originalPrice !== undefined && (
        <del className="ml-1.5 text-xs font-normal text-gray-400">
          {formatCurrency(originalPrice)}
        </del>
      )}
    </>
  );
}
