import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VoucherInput } from "./voucher-input";
import { CheckoutModal } from "./checkout-modal";
import { voucherService, type Voucher } from "@/services/voucher.service";
import { ApiError, NotFoundError } from "@/lib/errors";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
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
    expect(screen.queryByLabelText("Xoá voucher")).toBeNull();
    expect(screen.getByText(/tối thiểu 300\.000đ/)).toBeTruthy();
  });

  it("voucher theo phần trăm: subtotal đổi mà vẫn đủ điều kiện thì mức giảm được tính lại và báo parent", async () => {
    vi.spyOn(voucherService, "getVoucherByCode").mockResolvedValue({
      ...summer50k,
      discount_method: "PERCENT",
      discount_percent: 10,
      discount_amount_money: undefined,
      min_purchase_money: 0,
    });
    const onApplied = vi.fn<(r: VoucherValidateResponse | null) => void>();
    const { rerender } = wrap(<VoucherInput courseIds={["a"]} subtotal={1000000} onApplied={onApplied} />);
    await applyCode();
    expect(onApplied).toHaveBeenLastCalledWith(expect.objectContaining({ discount_amount: 100000 }));

    await act(async () => {
      rerender(<VoucherInput courseIds={["a"]} subtotal={500000} onApplied={onApplied} />);
    });

    // Chip và parent phải cùng thấy mức giảm mới, nếu không tổng tiền lệch chip.
    expect(onApplied).toHaveBeenLastCalledWith(expect.objectContaining({ discount_amount: 50000 }));
    expect(screen.getByText(/Giảm 50\.000/)).toBeTruthy();
  });

  it("subtotal đổi nhưng vẫn đủ điều kiện: giữ voucher, không gọi parent thừa", async () => {
    const onApplied = vi.fn();
    const { rerender } = wrap(<VoucherInput courseIds={["a"]} subtotal={799000} onApplied={onApplied} />);
    await applyCode();
    const calls = onApplied.mock.calls.length;

    await act(async () => {
      rerender(<VoucherInput courseIds={["a"]} subtotal={699000} onApplied={onApplied} />);
    });

    expect(screen.getByLabelText("Xoá voucher")).toBeTruthy();
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


describe("VoucherInput — hiện lý do thật khi tra mã lỗi (F-02 smoke 3)", () => {
  const FIRST_ORDER_MESSAGE = "Mã giảm giá này chỉ áp dụng cho đơn hàng đầu tiên của bạn";

  function applyCodeOnly() {
    fireEvent.change(screen.getByPlaceholderText("Nhập mã voucher"), { target: { value: "WELCOME20" } });
    fireEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
  }

  it("409 VOUCHER_FIRST_ORDER_ONLY: hiện câu của backend, cả inline lẫn toast", async () => {
    vi.spyOn(voucherService, "getVoucherByCode").mockRejectedValue(
      new ApiError(409, "VOUCHER_FIRST_ORDER_ONLY", FIRST_ORDER_MESSAGE)
    );
    wrap(<VoucherInput courseIds={["c1"]} onApplied={vi.fn()} />);
    applyCodeOnly();
    expect(await screen.findByText(FIRST_ORDER_MESSAGE)).toBeTruthy();
    expect(screen.queryByText("Không tìm thấy voucher hoặc mã không hợp lệ")).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(FIRST_ORDER_MESSAGE);
  });

  it("409 mà message không phải tiếng Việt: dịch theo code, không in tiếng Anh", async () => {
    vi.spyOn(voucherService, "getVoucherByCode").mockRejectedValue(
      new ApiError(409, "VOUCHER_FIRST_ORDER_ONLY", "voucher is first order only")
    );
    wrap(<VoucherInput courseIds={["c1"]} onApplied={vi.fn()} />);
    applyCodeOnly();
    expect(await screen.findByText(FIRST_ORDER_MESSAGE)).toBeTruthy();
  });

  it("404 thật: giữ câu chung 'Không tìm thấy voucher hoặc mã không hợp lệ'", async () => {
    vi.spyOn(voucherService, "getVoucherByCode").mockRejectedValue(new NotFoundError("Resource not found"));
    wrap(<VoucherInput courseIds={["c1"]} onApplied={vi.fn()} />);
    applyCodeOnly();
    expect(await screen.findByText("Không tìm thấy voucher hoặc mã không hợp lệ")).toBeTruthy();
    expect(toast.error).toHaveBeenCalledWith("Không tìm thấy voucher hoặc mã không hợp lệ");
  });
});

describe("VoucherInput — voucher 'đơn hàng đầu tiên' với khách chưa đăng nhập (Wave-2 W2-9)", () => {
  // Backend (contract-be1 F-02): tra mã cho KHÁCH vẫn 200 kèm `first_order_only: true` vì chưa biết khách đã mua chưa;
  // quyền hưởng chỉ được kiểm khi đã đăng nhập. Web không được hiện mức giảm như thể mã đã chắc chắn áp dụng được.
  const GUEST_MESSAGE = "Mã này chỉ áp dụng cho đơn hàng đầu tiên của tài khoản. Hãy đăng nhập để kiểm tra và áp dụng.";
  const welcome: Voucher = { ...summer50k, code: "WELCOME20", min_purchase_money: 0, first_order_only: true };

  beforeEach(() => {
    vi.spyOn(voucherService, "getVoucherByCode").mockResolvedValue(welcome);
  });
  afterEach(() => {
    useAuthStore.setState({ sessionStatus: "checking", isAuthenticated: false });
  });

  function applyWelcome() {
    fireEvent.change(screen.getByPlaceholderText("Nhập mã voucher"), { target: { value: "WELCOME20" } });
    fireEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
  }

  it("khách: không hiện chip 'Giảm ...', báo cần đăng nhập và không báo parent có giảm giá", async () => {
    useAuthStore.setState({ sessionStatus: "anonymous", isAuthenticated: false });
    const onApplied = vi.fn<(r: VoucherValidateResponse | null) => void>();
    wrap(<VoucherInput courseIds={["c1"]} subtotal={500000} onApplied={onApplied} />);
    applyWelcome();

    expect(await screen.findByText(GUEST_MESSAGE)).toBeTruthy();
    expect(screen.queryByText(/Giảm/)).toBeNull();
    expect(screen.queryByLabelText("Xoá voucher")).toBeNull();
    expect(onApplied).toHaveBeenLastCalledWith(null);
    expect(onApplied).not.toHaveBeenCalledWith(expect.objectContaining({ valid: true }));
  });

  it("đã đăng nhập: áp dụng bình thường (backend đã kiểm quyền hưởng)", async () => {
    useAuthStore.setState({ sessionStatus: "authenticated", isAuthenticated: true });
    const onApplied = vi.fn<(r: VoucherValidateResponse | null) => void>();
    wrap(<VoucherInput courseIds={["c1"]} subtotal={500000} onApplied={onApplied} />);
    applyWelcome();

    await waitFor(() => expect(screen.getByText(/Giảm/)).toBeTruthy());
    expect(onApplied).toHaveBeenLastCalledWith(expect.objectContaining({ valid: true, discount_amount: 50000 }));
  });

  it("khách + voucher thường (không first_order_only): vẫn áp dụng", async () => {
    useAuthStore.setState({ sessionStatus: "anonymous", isAuthenticated: false });
    vi.spyOn(voucherService, "getVoucherByCode").mockResolvedValue({ ...welcome, first_order_only: false });
    wrap(<VoucherInput courseIds={["c1"]} subtotal={500000} onApplied={vi.fn()} />);
    applyWelcome();
    await waitFor(() => expect(screen.getByText(/Giảm/)).toBeTruthy());
  });
});
