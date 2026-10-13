import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CartPage from "./page";
import type { Cart } from "@/services/cart.service";

// F-16: khoá chưa có thumbnail từng hiện khối gradient xanh; phải dùng placeholder giống thẻ khoá học.
const cart: Cart = {
  items: [
    { id: "ci-1", course_id: "c1", course: { id: "c1", title: "Khoá không ảnh", price: 100000 } },
    { id: "ci-2", course_id: "c2", course: { id: "c2", title: "Khoá không ảnh 2", price: 200000 } },
  ],
  total: 300000,
  total_item: 2,
};

vi.mock("@/hooks/queries/use-cart", () => ({
  useCart: () => ({ data: cart, isLoading: false, isError: false, error: null, refetch: vi.fn() }),
  useRemoveFromCart: () => ({ mutate: vi.fn(), isPending: false }),
  useClearCart: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/components/checkout/voucher-input", () => ({ VoucherInput: () => null }));

describe("CartPage — placeholder thumbnail", () => {
  it("mỗi dòng thiếu ảnh hiện placeholder chuẩn, không còn gradient xanh", () => {
    const { container } = render(<CartPage />);
    expect(screen.getAllByTestId("course-thumbnail-placeholder")).toHaveLength(2);
    expect(container.innerHTML).not.toContain("from-primary-400");
  });
});
