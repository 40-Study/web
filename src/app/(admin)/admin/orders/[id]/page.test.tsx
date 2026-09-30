/**
 * Refund dialog — bắt buộc nhập lý do trước khi cho phép xác nhận hoàn tiền
 * (phase-02-orders-refund.md § "Test cần có": "test dialog hoàn tiền bắt buộc lý do").
 *
 * Tiền thật — nút "Xác nhận đã hoàn tiền" PHẢI bị disable khi chưa nhập lý do, và PHẢI gọi
 * đúng payload {reason, refund_method: "manual_bank_transfer"} khi bấm sau khi đã nhập.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import AdminOrderDetailPage from "./page";

const mockMutate = vi.fn();
const mockLateRefundMutate = vi.fn();

const COMPLETED_ORDER = {
  id: "order-1",
  order_number: "ORD-TEST-1",
  status: "completed",
  total_amount: 699000,
  currency: "VND",
  payment_method: "bank_transfer",
  created_at: "2026-09-28T00:00:00Z",
  paid_at: "2026-09-28T00:01:00Z",
  items: [
    {
      id: "item-1",
      course_id: "course-1",
      course_name: "Khóa test",
      price: 699000,
      discount_amount: 0,
      final_price: 699000,
    },
  ],
};
// Mỗi test đặt lại đơn cần hiển thị (mặc định: đơn đã hoàn tất, dùng cho các test hoàn tiền gốc).
let mockOrder: Record<string, unknown> = COMPLETED_ORDER;

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "order-1" }),
}));

vi.mock("@/hooks/queries/use-admin-orders", () => ({
  useAdminOrder: () => ({
    data: mockOrder,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useRefundOrder: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  useMarkLateRefunded: () => ({
    mutate: mockLateRefundMutate,
    isPending: false,
  }),
}));

describe("AdminOrderDetailPage — refund dialog", () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockLateRefundMutate.mockReset();
    mockOrder = COMPLETED_ORDER;
    useAuthStore.setState({
      sessionStatus: "authenticated",
      permissions: ["PAYMENTS_MANAGE"],
    } as Partial<ReturnType<typeof useAuthStore.getState>>);
  });

  it("disables the confirm button until a reason is typed", () => {
    render(<AdminOrderDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: "Hoàn tiền" }));

    const confirmBtn = screen.getByRole("button", {
      name: "Xác nhận đã hoàn tiền",
    }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);

    fireEvent.change(screen.getByPlaceholderText(/Học viên khiếu nại/i), {
      target: { value: "Học viên khiếu nại nội dung sai" },
    });

    // Chưa có mã giao dịch: vẫn chặn (B6, quyết định #1 "kèm mã giao dịch").
    expect(confirmBtn.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText(/Mã giao dịch chuyển khoản/i), {
      target: { value: "FT26271123456789" },
    });

    expect(confirmBtn.disabled).toBe(false);
  });

  it("submits reason + fixed manual_bank_transfer method, never wallet_credit", () => {
    render(<AdminOrderDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: "Hoàn tiền" }));
    fireEvent.change(screen.getByPlaceholderText(/Học viên khiếu nại/i), {
      target: { value: "Đã xác minh và đồng ý hoàn tiền" },
    });
    fireEvent.change(screen.getByLabelText(/Mã giao dịch chuyển khoản/i), {
      target: { value: "  FT26271123456789  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đã hoàn tiền" }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const [payload] = mockMutate.mock.calls[0] as [
      { id: string; dto: { reason: string; refund_method: string; transaction_ref: string } },
    ];
    expect(payload.id).toBe("order-1");
    expect(payload.dto.reason).toBe("Đã xác minh và đồng ý hoàn tiền");
    // Quyết định #1 (27/09/2026): KHÔNG hoàn vào ví xu — chỉ 1 giá trị hợp lệ.
    expect(payload.dto.refund_method).toBe("manual_bank_transfer");
    expect(payload.dto.transaction_ref).toBe("FT26271123456789");
  });

  it("hiện nhãn trạng thái tiếng Việt thay vì mã thô (B6)", () => {
    render(<AdminOrderDetailPage />);
    expect(screen.getByText("Hoàn tất")).toBeTruthy();
    expect(screen.queryByText("completed")).toBeNull();
  });

  it("does not show the refund button without PAYMENTS_MANAGE permission", () => {
    useAuthStore.setState({
      sessionStatus: "authenticated",
      permissions: [],
    } as Partial<ReturnType<typeof useAuthStore.getState>>);

    render(<AdminOrderDetailPage />);

    expect(screen.queryByRole("button", { name: "Hoàn tiền" })).toBeNull();
  });
});

// Lane P: đơn đã huỷ/hết hạn nhận tiền về muộn (refund_needed): admin chuyển khoản hoàn tay rồi ghi nhận.
describe("AdminOrderDetailPage — đánh dấu đã hoàn tiền (tiền về muộn)", () => {
  const FLAGGED = { ...COMPLETED_ORDER, status: "cancelled", refund_needed: true };

  beforeEach(() => {
    mockLateRefundMutate.mockReset();
    mockOrder = FLAGGED;
    useAuthStore.setState({
      sessionStatus: "authenticated",
      permissions: ["PAYMENTS_MANAGE"],
    } as Partial<ReturnType<typeof useAuthStore.getState>>);
  });

  it("đơn có cờ: badge 'Cần hoàn tiền' + nút đánh dấu, KHÔNG có nút hoàn tiền đơn đã thanh toán", () => {
    render(<AdminOrderDetailPage />);
    expect(screen.getByText("Cần hoàn tiền")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Đánh dấu đã hoàn tiền" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hoàn tiền" })).toBeNull();
  });

  it("phải xác nhận trong hộp thoại, ghi chú và mã giao dịch tuỳ chọn, gửi đúng payload đã trim", () => {
    render(<AdminOrderDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu đã hoàn tiền" }));
    // Mới mở hộp thoại: chưa gọi backend.
    expect(mockLateRefundMutate).not.toHaveBeenCalled();
    const confirmBtn = screen.getByRole("button", { name: "Xác nhận đã hoàn tiền" }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(false); // hai trường đều không bắt buộc

    fireEvent.change(screen.getByLabelText(/Mã giao dịch hoàn/i), { target: { value: "  FT-LATE-1 " } });
    fireEvent.change(screen.getByLabelText(/Ghi chú/i), { target: { value: " Đã CK lại " } });
    fireEvent.click(confirmBtn);

    expect(mockLateRefundMutate).toHaveBeenCalledTimes(1);
    const [payload] = mockLateRefundMutate.mock.calls[0] as [{ id: string; dto: { note: string; transaction_ref: string } }];
    expect(payload).toEqual({ id: "order-1", dto: { note: "Đã CK lại", transaction_ref: "FT-LATE-1" } });
  });

  it("có thể xác nhận không cần ghi chú hay mã giao dịch", () => {
    render(<AdminOrderDetailPage />);
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu đã hoàn tiền" }));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đã hoàn tiền" }));
    expect(mockLateRefundMutate.mock.calls[0][0]).toEqual({ id: "order-1", dto: { note: "", transaction_ref: "" } });
  });

  it("không có quyền PAYMENTS_MANAGE thì không thấy nút", () => {
    useAuthStore.setState({ sessionStatus: "authenticated", permissions: [] } as Partial<ReturnType<typeof useAuthStore.getState>>);
    render(<AdminOrderDetailPage />);
    expect(screen.queryByRole("button", { name: "Đánh dấu đã hoàn tiền" })).toBeNull();
  });

  it("đã ghi nhận hoàn: badge đổi thành 'Đã hoàn tiền', hết nút", () => {
    mockOrder = { ...FLAGGED, refund_needed: false, late_refunded_at: "2026-09-30T08:00:00Z" };
    render(<AdminOrderDetailPage />);
    expect(screen.getByText("Đã hoàn tiền")).toBeTruthy();
    expect(screen.queryByText("Cần hoàn tiền")).toBeNull();
    expect(screen.queryByRole("button", { name: "Đánh dấu đã hoàn tiền" })).toBeNull();
  });

  it("đơn huỷ không có cờ thì không có nút", () => {
    mockOrder = { ...COMPLETED_ORDER, status: "cancelled" };
    render(<AdminOrderDetailPage />);
    expect(screen.queryByRole("button", { name: "Đánh dấu đã hoàn tiền" })).toBeNull();
  });
});