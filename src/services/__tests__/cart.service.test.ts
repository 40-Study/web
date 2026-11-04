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

// QA3 Q10: backend gửi thumbnail_url + instructor_name; UI đọc course.thumbnail + course.instructor.name.
describe("cartService — map thumbnail_url / instructor_name (Q10)", () => {
  const backendItem = {
    id: "i1",
    course_id: "c1",
    course: {
      id: "c1",
      title: "Docker & Kubernetes",
      price: 799000,
      thumbnail_url: "https://cdn.test/docker.png",
      instructor_name: "Nguyễn Văn A",
    },
  };

  it("getCart đổ thumbnail_url -> course.thumbnail và instructor_name -> course.instructor.name", async () => {
    get.mockResolvedValue({ data: { data: { items: [backendItem], total: 799000, total_item: 1 } } });
    const cart = await cartService.getCart();
    expect(cart.items[0].course?.thumbnail).toBe("https://cdn.test/docker.png");
    expect(cart.items[0].course?.instructor?.name).toBe("Nguyễn Văn A");
  });

  it("giữ nguyên thumbnail/instructor nếu backend đã trả sẵn, không ghi đè", async () => {
    get.mockResolvedValue({
      data: {
        data: {
          items: [{ ...backendItem, course: { ...backendItem.course, thumbnail: "x.png", instructor: { id: "u", name: "B" } } }],
          total: 0,
          total_item: 1,
        },
      },
    });
    const cart = await cartService.getCart();
    expect(cart.items[0].course?.thumbnail).toBe("x.png");
    expect(cart.items[0].course?.instructor).toEqual({ id: "u", name: "B" });
  });

  it("khoá không có ảnh/giảng viên -> để undefined (UI hiện ảnh giữ chỗ)", async () => {
    get.mockResolvedValue({ data: { data: { items: [{ id: "i", course_id: "c", course: { id: "c", title: "T", price: 1 } }], total: 1, total_item: 1 } } });
    const cart = await cartService.getCart();
    expect(cart.items[0].course?.thumbnail).toBeUndefined();
    expect(cart.items[0].course?.instructor).toBeUndefined();
  });
});
