import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CheckoutPage from "./page";
import type { Cart } from "@/services/cart.service";

// Order service tính subtotal bằng Course.EffectivePrice (order_service.go:291) — trang checkout
// phải hiện đúng số tiền sẽ bị tính, không phải tổng giá niêm yết.
const cart: Cart = {
  items: [
    { id: "ci-1", course_id: "c1", course: { id: "c1", title: "Khoá giảm giá", price: 999000, discount_price: 499000 } },
    { id: "ci-2", course_id: "c2", course: { id: "c2", title: "Khoá giá thường", price: 300000 } },
  ],
  total: 799000,
  total_item: 2,
};

vi.mock("@/hooks/queries/use-cart", () => ({
  useCart: () => ({ data: cart, isLoading: false }),
  useClearCart: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/queries/use-orders", () => ({
  useCreateOrder: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCancelOrder: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/components/checkout/voucher-input", () => ({
  VoucherInput: ({ subtotal }: { subtotal: number }) => (
    <span data-testid="voucher-subtotal">{subtotal}</span>
  ),
}));

vi.mock("@/components/checkout/order-payment-dialog", () => ({
  OrderPaymentDialog: () => null,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

// Intl chèn NBSP trước "₫"; testing-library chuẩn hoá khoảng trắng của node nhưng không chuẩn hoá
// chuỗi cần tìm -> chuẩn hoá về khoảng trắng thường để so khớp chính xác.
const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
    .format(n)
    .replace(/\s/g, " ");

describe("CheckoutPage — tạm tính/tổng cộng theo giá bán", () => {
  it("subtotal truyền cho voucher = tổng giá bán", () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId("voucher-subtotal").textContent).toBe("799000");
  });

  it("nút thanh toán hiện tổng giá bán", () => {
    render(<CheckoutPage />);
    // accessible name giữ nguyên NBSP của Intl -> chuẩn hoá trước khi so
    expect(
      screen.getByRole("button", {
        name: (name) => name.replace(/\s/g, " ") === `Thanh toán ${fmt(799000)}`,
      }),
    ).toBeTruthy();
  });

  it("dòng giảm giá hiện giá bán, giá niêm yết bị gạch", () => {
    render(<CheckoutPage />);
    expect(screen.getByText(fmt(499000))).toBeTruthy();
    expect(screen.getByText(fmt(999000)).tagName).toBe("DEL");
  });
});
