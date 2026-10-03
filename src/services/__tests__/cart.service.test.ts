import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
const del = vi.fn();

vi.mock("@/lib/api-client", () => ({
  api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), delete: (...a: unknown[]) => del(...a) },
}));

import { cartService } from "../cart.service";

// A-28 (QA hồi quy 03/10): mọi gọi giỏ hàng đi qua "/cart/" bị 308 về "/cart" (kể cả POST/DELETE) nên mỗi
// thao tác tốn thêm một vòng request. Gọi thẳng đường dẫn không có dấu gạch chéo cuối.
describe("cartService — không dùng gạch chéo cuối để tránh 308", () => {
  beforeEach(() => {
    get.mockResolvedValue({ data: { data: {} } });
    post.mockResolvedValue({ data: { data: {} } });
    del.mockResolvedValue({ data: {} });
  });

  it("getCart / addToCart / removeFromCart gọi /cart", async () => {
    await cartService.getCart();
    await cartService.addToCart("c1");
    await cartService.removeFromCart(["c1"]);
    expect(get).toHaveBeenCalledWith("/cart");
    expect(post).toHaveBeenCalledWith("/cart", { course_id: "c1" });
    expect(del).toHaveBeenCalledWith("/cart", { data: { course_ids: ["c1"] } });
  });
});
