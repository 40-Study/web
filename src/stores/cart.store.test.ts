import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "./cart.store";
import type { CartItem } from "@/services/cart.service";

function item(id: string, price: number, discount_price?: number | string | null): CartItem {
  return {
    id: `ci-${id}`,
    course_id: id,
    course: { id, title: `Khoá ${id}`, price, discount_price },
  };
}

// Backend cart/order tính tiền theo Course.EffectivePrice (giá bán = discount_price khi hợp lệ).
// Tổng lạc quan phía client phải khớp, nếu không dropdown nháy sai số tiền tới lần sync kế tiếp.
describe("cart store — tổng lạc quan theo giá phải trả", () => {
  beforeEach(() => {
    useCartStore.getState().clearCache();
  });

  it("optimisticAdd khoá giảm giá cộng GIÁ BÁN", () => {
    useCartStore.getState().optimisticAdd(item("a", 999000, 499000));
    expect(useCartStore.getState().total).toBe(499000);
    expect(useCartStore.getState().total_item).toBe(1);
  });

  it("optimisticAdd khoá không giảm giá cộng giá niêm yết", () => {
    useCartStore.getState().optimisticAdd(item("b", 300000));
    expect(useCartStore.getState().total).toBe(300000);
  });

  it("discount_price không hợp lệ (>= price) bị bỏ qua", () => {
    useCartStore.getState().optimisticAdd(item("c", 300000, 300000));
    expect(useCartStore.getState().total).toBe(300000);
  });

  it("optimisticRemove khoá giảm giá trừ đúng GIÁ BÁN đã cộng", () => {
    const s = useCartStore.getState();
    s.optimisticAdd(item("a", 999000, 499000));
    s.optimisticAdd(item("b", 300000));
    expect(useCartStore.getState().total).toBe(799000);

    useCartStore.getState().optimisticRemove("a");
    expect(useCartStore.getState().total).toBe(300000);
    expect(useCartStore.getState().total_item).toBe(1);
  });

  it("add rồi remove cùng một khoá -> về 0", () => {
    const s = useCartStore.getState();
    s.optimisticAdd(item("a", 999000, "499000.00"));
    useCartStore.getState().optimisticRemove("a");
    expect(useCartStore.getState().total).toBe(0);
  });
});
