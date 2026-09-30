import { describe, expect, it } from "vitest";
import { resolveEffectivePrice } from "./course-pricing";

// Quy tắc khớp backend Course.EffectivePrice (backend/internal/model/course_pricing.go):
// discount_price hợp lệ khi khác nil, không âm và THẤP HƠN price; khi đó nó là giá phải trả.
describe("resolveEffectivePrice — khớp Course.EffectivePrice của backend", () => {
  it("giảm giá hợp lệ -> price = giá bán, originalPrice = giá niêm yết", () => {
    expect(resolveEffectivePrice(999000, 499000)).toEqual({ price: 499000, originalPrice: 999000 });
  });

  it("decimal dạng chuỗi -> vẫn ra số đúng chiều", () => {
    expect(resolveEffectivePrice("999000.00", "499000.00")).toEqual({
      price: 499000,
      originalPrice: 999000,
    });
  });

  it("discount = 0 hợp lệ (không âm, < price) -> giá bán 0đ", () => {
    expect(resolveEffectivePrice(999000, 0)).toEqual({ price: 0, originalPrice: 999000 });
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["chuỗi rỗng", ""],
  ])("discount %s -> không giảm giá (không biến thành 0đ)", (_label, discount) => {
    expect(resolveEffectivePrice(999000, discount)).toEqual({ price: 999000 });
  });

  it.each([
    ["bằng price", 999000],
    ["lớn hơn price", 1200000],
    ["âm", -1],
    ["NaN", "abc"],
  ])("discount %s -> bỏ qua, giữ giá niêm yết", (_label, discount) => {
    expect(resolveEffectivePrice(999000, discount)).toEqual({ price: 999000 });
  });

  it("price không phải số hợp lệ -> 0đ, không ném lỗi", () => {
    expect(resolveEffectivePrice(undefined, undefined)).toEqual({ price: 0 });
    expect(resolveEffectivePrice("abc", 100)).toEqual({ price: 0 });
  });
});
