import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CartPage from "./page";
import type { Cart } from "@/services/cart.service";

// Backend cart trả price (niêm yết) + discount_price (giá bán) và tính total theo giá bán
// (cart_service.go GetCart -> Course.EffectivePrice). Trang phải hiện + cộng đúng giá bán.
const cart: Cart = {
  items: [
    { id: "ci-1", course_id: "c1", course: { id: "c1", title: "Khoá giảm giá", price: 999000, discount_price: 499000 } },
    { id: "ci-2", course_id: "c2", course: { id: "c2", title: "Khoá giá thường", price: 300000 } },
  ],
  total: 799000,
  total_item: 2,
};

vi.mock("@/hooks/queries/use-cart", () => ({
  useCart: () => ({ data: cart, isLoading: false, isError: false, error: null, refetch: vi.fn() }),
  useRemoveFromCart: () => ({ mutate: vi.fn(), isPending: false }),
  useClearCart: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Lộ prop `subtotal` để kiểm số tiền trang truyền đi (backend validate voucher trên subtotal này).
vi.mock("@/components/checkout/voucher-input", () => ({
  VoucherInput: ({ subtotal }: { subtotal: number }) => (
    <span data-testid="voucher-subtotal">{subtotal}</span>
  ),
}));

// Intl chèn NBSP trước "₫"; testing-library chuẩn hoá khoảng trắng của node nhưng không chuẩn hoá
// chuỗi cần tìm -> chuẩn hoá về khoảng trắng thường để so khớp chính xác.
const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
    .format(n)
    .replace(/\s/g, " ");

describe("CartPage — giá dòng và tạm tính theo giá bán", () => {
  it("dòng giảm giá hiện giá bán, giá niêm yết bị gạch", () => {
    render(<CartPage />);
    expect(screen.getByText(fmt(499000))).toBeTruthy();
    expect(screen.getByText(fmt(999000)).tagName).toBe("DEL");
  });

  it("dòng không giảm giá hiện một giá, không gạch", () => {
    render(<CartPage />);
    expect(screen.getByText(fmt(300000)).tagName).not.toBe("DEL");
  });

  it("mặc định chọn sẵn tất cả -> tạm tính = tổng giá bán", () => {
    render(<CartPage />);
    expect(screen.getByTestId("voucher-subtotal").textContent).toBe("799000");
  });

  it("bỏ chọn khoá thường -> tạm tính chỉ còn giá bán khoá giảm giá", () => {
    render(<CartPage />);
    // Mặc định chọn hết. checkbox[0] là "Chọn tất cả"; [2] là dòng thứ hai (khoá giá thường)
    // -> bỏ tick nó đi, chỉ còn khoá giảm giá.
    fireEvent.click(screen.getAllByRole("checkbox")[2]);
    expect(screen.getByTestId("voucher-subtotal").textContent).toBe("499000");
    // Tạm tính và Tổng cộng cùng hiện 499.000 ₫
    expect(screen.getAllByText(fmt(499000)).length).toBeGreaterThanOrEqual(3);
  });

  it("bỏ chọn hết -> tạm tính = total của server, nút thanh toán tắt", () => {
    render(<CartPage />);
    fireEvent.click(screen.getAllByRole("checkbox")[0]); // đang chọn hết -> bỏ chọn hết
    expect(screen.getByTestId("voucher-subtotal").textContent).toBe("799000");
    expect(screen.getByTestId("cart-select-hint")).toBeTruthy();
  });
});
