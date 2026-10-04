/**
 * QA A-04 ở mức TRANG: chọn khoá trong giỏ làm mất voucher nhưng chip vẫn báo "đang áp dụng" (tổng không giảm,
 * link Thanh toán mất `voucher=`). Sửa nằm ở cart/page.tsx (không còn `setVoucherResult(null)` mỗi lần chọn),
 * nên test này dùng VoucherInput THẬT: revert riêng file trang thì test ĐỎ (test của VoucherInput đơn lẻ không bắt được).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CartPage from "./page";
import type { Cart } from "@/services/cart.service";
import { voucherService, type Voucher } from "@/services/voucher.service";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

const cart: Cart = {
  items: [
    { id: "ci-1", course_id: "c1", course: { id: "c1", title: "Khoá giảm giá", price: 999000, discount_price: 499000 } },
    { id: "ci-2", course_id: "c2", course: { id: "c2", title: "Khoá giá thường", price: 300000 } },
  ],
  total: 799000,
  item_count: 2,
};

vi.mock("@/hooks/queries/use-cart", () => ({
  useCart: () => ({ data: cart, isLoading: false, isError: false, error: null, refetch: vi.fn() }),
  useRemoveFromCart: () => ({ mutate: vi.fn(), isPending: false }),
  useClearCart: () => ({ mutate: vi.fn(), isPending: false }),
}));

const voucher = (code: string, minPurchase: number): Voucher => ({
  id: code,
  code,
  name: code,
  discount_unit: "MONEY",
  discount_method: "FIXED",
  discount_amount_money: 50000,
  min_purchase_money: minPurchase,
  is_active: true,
});

// Intl chèn NBSP trước "₫"; chuẩn hoá về khoảng trắng thường để so khớp.
const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n).replace(/\s/g, " ");

function renderCart() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CartPage />
    </QueryClientProvider>
  );
}

async function applyCode(code: string) {
  fireEvent.change(screen.getByPlaceholderText("Nhập mã voucher"), { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
  await waitFor(() => expect(screen.getByLabelText("Xóa voucher")).toBeTruthy());
}

const checkoutHref = () => (screen.getByRole("link", { name: /Thanh toán/ }) as HTMLAnchorElement).getAttribute("href") ?? "";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("CartPage — voucher sống sót khi chọn khoá (A-04)", () => {
  it("chọn một khoá vẫn đủ điều kiện tối thiểu: giữ voucher, dòng Giảm giá và link Thanh toán khớp chip", async () => {
    vi.spyOn(voucherService, "getVoucherByCode").mockResolvedValue(voucher("SUMMER50K", 300000));
    renderCart();
    await applyCode("SUMMER50K");
    expect(screen.getByText("-" + fmt(50000))).toBeTruthy();

    // checkbox[0] là "Chọn tất cả"; [2] là dòng thứ hai (300.000đ, đúng bằng mức tối thiểu)
    fireEvent.click(screen.getAllByRole("checkbox")[2]);

    // Chip còn thì tổng PHẢI còn giảm: lỗi cũ là chip "SUMMER50K — Giảm 50.000" nhưng "Giảm giá -0 ₫".
    expect(screen.getByLabelText("Xóa voucher")).toBeTruthy();
    expect(screen.getByText("-" + fmt(50000))).toBeTruthy();
    expect(screen.getByText(fmt(250000), { selector: "span.text-xl" })).toBeTruthy();
    expect(checkoutHref()).toContain("voucher=SUMMER50K");
    expect(checkoutHref()).toContain("items=c2");
  });

  it("chọn khoá làm đơn không đủ điều kiện tối thiểu: gỡ voucher, hiện lý do, link không còn voucher", async () => {
    vi.spyOn(voucherService, "getVoucherByCode").mockResolvedValue(voucher("BIG500", 500000));
    renderCart();
    await applyCode("BIG500");

    fireEvent.click(screen.getAllByRole("checkbox")[2]); // chỉ còn 300.000đ < 500.000đ

    await waitFor(() => expect(screen.queryByLabelText("Xóa voucher")).toBeNull());
    expect(screen.getByText(/tối thiểu 500\.000đ/)).toBeTruthy();
    expect(screen.queryByText(/Giảm giá/)).toBeNull();
    expect(checkoutHref()).not.toContain("voucher=");
  });
});