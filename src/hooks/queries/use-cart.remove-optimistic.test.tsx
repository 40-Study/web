/**
 * QA-A-12: bấm "Xoá" ở giỏ, API trả 200 nhưng 2 giây sau dòng vẫn còn (chỉ invalidate rồi chờ refetch chậm).
 * Dòng phải biến mất khỏi cache NGAY khi bấm; request lỗi thì giỏ trở lại như cũ.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { cartService, type Cart } from "@/services/cart.service";
import { cartKeys, useRemoveFromCart } from "./use-cart";

const cart: Cart = {
  items: [
    { id: "ci-1", course_id: "c1", course: { id: "c1", title: "Flutter", price: 599000 } },
    { id: "ci-2", course_id: "c2", course: { id: "c2", title: "React", price: 300000 } },
  ],
  total: 899000,
  total_item: 2,
};

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  client.setQueryData(cartKeys.detail(), cart);
  // Refetch sau khi xong không được chạm mạng thật trong test.
  vi.spyOn(cartService, "getCart").mockResolvedValue(cart);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useRemoveFromCart(), { wrapper });
  return { client, result };
}

beforeEach(() => {
  vi.restoreAllMocks();
  toast.error.mockClear();
  toast.success.mockClear();
});

describe("useRemoveFromCart — cập nhật lạc quan (QA-A-12)", () => {
  it("bỏ dòng khỏi giỏ ngay khi bấm, trước khi server trả lời", async () => {
    let resolve: () => void = () => {};
    vi.spyOn(cartService, "removeFromCart").mockReturnValue(new Promise<void>((r) => (resolve = r)) as never);
    const { client, result } = setup();

    act(() => result.current.mutate("c1"));

    await waitFor(() => {
      const current = client.getQueryData<Cart>(cartKeys.detail());
      expect(current?.items.map((i) => i.course_id)).toEqual(["c2"]);
    });
    const current = client.getQueryData<Cart>(cartKeys.detail());
    expect(current?.total_item).toBe(1);
    expect(current?.total).toBe(300000);
    // server vẫn chưa trả lời
    expect(result.current.isPending).toBe(true);

    act(() => resolve());
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Đã xoá khỏi giỏ hàng"));
  });

  it("server lỗi: trả lại giỏ cũ và báo lỗi", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(cartService, "removeFromCart").mockRejectedValue(new Error("boom"));
    const { client, result } = setup();

    act(() => result.current.mutate("c1"));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Không thể xoá khỏi giỏ hàng"));
    expect(client.getQueryData<Cart>(cartKeys.detail())?.items.map((i) => i.course_id)).toEqual(["c1", "c2"]);
  });
});
