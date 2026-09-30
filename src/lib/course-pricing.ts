/**
 * Quy tắc "giá phải trả" của một khoá học — SSOT phía web, khớp `Course.EffectivePrice`
 * (backend/internal/model/course_pricing.go), nơi giỏ hàng và đơn hàng tính tiền.
 *
 * `discount_price` của backend là GIÁ BÁN (không phải giá gốc). Giảm giá hợp lệ khi
 * 0 <= discount < price; khi đó `price` = giá phải trả, `originalPrice` = giá niêm yết (để UI gạch
 * giá + badge "-x%"). Ngược lại chỉ có `price`. Mọi nơi hiển thị/cộng tiền PHẢI gọi hàm này thay vì
 * tự chọn giữa price/discount_price.
 */

/** Decimal của backend có thể serialize thành số hoặc chuỗi tuỳ phiên bản. */
export type PriceInput = number | string | null | undefined;

export interface ResolvedPrices {
  /** Giá phải trả. */
  price: number;
  /** Giá niêm yết — chỉ có khi đang giảm giá. */
  originalPrice?: number;
}

export function resolveEffectivePrice(
  listPrice: PriceInput,
  discountPrice: PriceInput,
): ResolvedPrices {
  const list = Number(listPrice) || 0;
  // Number("") === 0 và Number(null) === 0 sẽ biến "không có giảm giá" thành "giảm còn 0đ".
  if (discountPrice === undefined || discountPrice === null || discountPrice === "") {
    return { price: list };
  }
  const sale = Number(discountPrice);
  if (!Number.isFinite(sale) || sale < 0 || sale >= list) {
    return { price: list };
  }
  return { price: sale, originalPrice: list };
}
