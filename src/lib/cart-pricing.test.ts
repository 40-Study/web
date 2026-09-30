import { describe, expect, it } from "vitest";
import { getCartItemPrices, sumCartItemPrices } from "./cart-pricing";

// Backend cart trả `course.price` (giá niêm yết) + `course.discount_price` (GIÁ BÁN) và tính
// `total` theo Course.EffectivePrice — web phải cộng đúng giá phải trả, không cộng giá niêm yết.
const discounted = { course: { price: 999000, discount_price: 499000 } };
const plain = { course: { price: 300000 } };

describe("getCartItemPrices", () => {
  it("khoá giảm giá -> price là giá bán, originalPrice là giá niêm yết", () => {
    expect(getCartItemPrices(discounted)).toEqual({ price: 499000, originalPrice: 999000 });
  });

  it("khoá không giảm giá -> chỉ có price", () => {
    expect(getCartItemPrices(plain)).toEqual({ price: 300000 });
  });

  it("thiếu course -> 0đ", () => {
    expect(getCartItemPrices({})).toEqual({ price: 0 });
  });
});

describe("sumCartItemPrices", () => {
  it("cộng theo giá phải trả (giá bán), không phải giá niêm yết", () => {
    expect(sumCartItemPrices([discounted, plain])).toBe(799000);
  });

  it("giỏ trống -> 0", () => {
    expect(sumCartItemPrices([])).toBe(0);
  });
});
