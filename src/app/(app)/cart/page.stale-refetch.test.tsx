/** Q10 #148 M2/H1: /cart dùng đúng StaleDataNotice chung (không còn thanh cam tự dựng) khi refetch giỏ lỗi mà còn cache. */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CartPage from "./page";
import type { Cart } from "@/services/cart.service";

const cart: Cart = {
  items: [{ id: "ci-1", course_id: "c1", course: { id: "c1", title: "Khoá giảm giá", price: 999000, discount_price: 499000 } }],
  total: 499000,
  total_item: 1,
};
const refetch = vi.fn(async () => undefined);

vi.mock("@/hooks/queries/use-cart", () => ({
  useCart: () => ({ data: cart, isLoading: false, isError: true, error: new Error("boom"), refetch }),
  useRemoveFromCart: () => ({ mutate: vi.fn(), isPending: false }),
  useClearCart: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

beforeEach(() => refetch.mockClear());

describe("/cart — Q10 #148 M2", () => {
  it("refetch lỗi mà còn giỏ: giữ giỏ + thông báo chung role=status với 'Thử lại'", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <CartPage />
      </QueryClientProvider>
    );
    expect(screen.getByText("Khoá giảm giá")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được giỏ hàng");
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
