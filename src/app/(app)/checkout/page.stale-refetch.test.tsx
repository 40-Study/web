/**
 * Q10 #148 H1: giỏ hàng còn cache mà refetch nền lỗi ở /checkout. Nút thanh toán bị khoá (giá có thể đã cũ) nên trang PHẢI
 * nói vì sao khoá và cho 'Thử lại', không để người dùng kẹt ở nút xám không lời giải thích.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CheckoutPage from "./page";
import type { Cart } from "@/services/cart.service";

const cart: Cart = {
  items: [{ id: "ci-1", course_id: "c1", course: { id: "c1", title: "Khoá giảm giá", price: 999000, discount_price: 499000 } }],
  total: 499000,
  total_item: 1,
};
const refetch = vi.fn(async () => undefined);
let state: { data: Cart | undefined; isError: boolean };

vi.mock("@/hooks/queries/use-cart", () => ({
  useCart: () => ({ ...state, isLoading: false, error: new Error("boom"), refetch }),
  useClearCart: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/queries/use-orders", () => ({
  useCreateOrder: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCancelOrder: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/components/checkout/voucher-input", () => ({ VoucherInput: () => null }));
vi.mock("@/components/checkout/order-payment-dialog", () => ({ OrderPaymentDialog: () => null }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CheckoutPage />
    </QueryClientProvider>
  );
const payButton = () => screen.getByRole("button", { name: /Thanh toán/ }) as HTMLButtonElement;

beforeEach(() => refetch.mockClear());

describe("/checkout — Q10 #148 H1", () => {
  it("refetch giỏ lỗi mà còn cache: nút thanh toán khoá + lời giải thích gắn aria-describedby + 'Thử lại'", () => {
    state = { data: cart, isError: true };
    renderPage();
    expect(payButton().disabled).toBe(true);
    const notice = screen.getByRole("status");
    expect(notice.textContent).toContain("Nút thanh toán tạm khoá");
    expect(payButton().getAttribute("aria-describedby")).toBe(notice.id);
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("không lỗi: nút thanh toán bật, không có thông báo", () => {
    state = { data: cart, isError: false };
    renderPage();
    expect(payButton().disabled).toBe(false);
    expect(screen.queryByRole("status")).toBeNull();
    expect(payButton().getAttribute("aria-describedby")).toBeNull();
  });

  it("lần tải đầu lỗi: hộp lỗi đầy đủ, không có thông báo dữ liệu cũ", () => {
    state = { data: undefined, isError: true };
    renderPage();
    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/Nút thanh toán tạm khoá/)).toBeNull();
  });
});
