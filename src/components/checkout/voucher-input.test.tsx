import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VoucherInput } from "./voucher-input";
import { CheckoutModal } from "./checkout-modal";
import { voucherService, type Voucher } from "@/services/voucher.service";
import type { VoucherValidateResponse } from "@/types/voucher";
import type { CourseDetail } from "@/types/course";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

// Giống SUMMER50K trong QA: giảm 50.000đ, đơn tối thiểu 300.000đ.
const summer50k: Voucher = {
  id: "v1",
  code: "SUMMER50K",
  name: "Summer",
  discount_unit: "MONEY",
  discount_method: "FIXED",
  discount_amount_money: 50000,
  min_purchase_money: 300000,
  is_active: true,
};

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return render(ui, { wrapper });
}

async function applyCode() {
  fireEvent.change(screen.getByPlaceholderText("Nhập mã voucher"), { target: { value: "SUMMER50K" } });
  fireEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
  await waitFor(() => expect(screen.getByText(/Giảm/)).toBeTruthy());
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(voucherService, "getVoucherByCode").mockResolvedValue(summer50k);
});

describe("VoucherInput — chip voucher luôn khớp với mức giảm thật (A-04)", () => {
  it("subtotal đổi xuống dưới mức tối thiểu: gỡ voucher, báo parent null và hiện lý do", async () => {
    const onApplied = vi.fn<(r: VoucherValidateResponse | null) => void>();
    const { rerender } = wrap(<VoucherInput courseIds={["a"]} subtotal={799000} onApplied={onApplied} />);
    await applyCode();
    expect(onApplied).toHaveBeenLastCalledWith(expect.objectContaining({ discount_amount: 50000 }));

    await act(async () => {
      rerender(<VoucherInput courseIds={["a"]} subtotal={100000} onApplied={onApplied} />);
    });

    expect(onApplied).toHaveBeenLastCalledWith(null);
    // Chip không được còn hiện "đang áp dụng" khi tổng tiền không còn giảm.
    expect(screen.queryByLabelText("Xóa voucher")).toBeNull();
    expect(screen.getByText(/tối thiểu 300\.000đ/)).toBeTruthy();
  });

  it("subtotal đổi nhưng vẫn đủ điều kiện: giữ voucher, không gọi parent thừa", async () => {
    const onApplied = vi.fn();
    const { rerender } = wrap(<VoucherInput courseIds={["a"]} subtotal={799000} onApplied={onApplied} />);
    await applyCode();
    const calls = onApplied.mock.calls.length;

    await act(async () => {
      rerender(<VoucherInput courseIds={["a"]} subtotal={699000} onApplied={onApplied} />);
    });

    expect(screen.getByLabelText("Xóa voucher")).toBeTruthy();
    expect(onApplied.mock.calls.length).toBe(calls);
  });
});

describe("CheckoutModal — voucher có đơn tối thiểu áp được theo giá khoá (A-05)", () => {
  const course = {
    id: "c1",
    title: "Python",
    thumbnail: "",
    price: 699000,
    instructor: { id: "i", name: "GV" },
  } as unknown as CourseDetail;

  it("SUMMER50K (tối thiểu 300.000đ) áp được cho khoá 699.000đ", async () => {
    wrap(<CheckoutModal open onOpenChange={vi.fn()} course={course} />);
    await applyCode();
    expect(screen.queryByText(/tối thiểu/)).toBeNull();
    expect(screen.getByText(/- 50\.000/)).toBeTruthy();
  });

  it("chỉ còn chuyển khoản ngân hàng, không có lựa chọn Thẻ/MoMo giả (A-18)", () => {
    wrap(<CheckoutModal open onOpenChange={vi.fn()} course={course} />);
    expect(screen.getByText("Chuyển khoản ngân hàng")).toBeTruthy();
    expect(screen.queryByText(/MoMo/)).toBeNull();
    expect(screen.queryByText(/Thẻ tín dụng/)).toBeNull();
  });
});
