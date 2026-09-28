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

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "order-1" }),
}));

vi.mock("@/hooks/queries/use-admin-orders", () => ({
  useAdminOrder: () => ({
    data: {
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
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useRefundOrder: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

describe("AdminOrderDetailPage — refund dialog", () => {
  beforeEach(() => {
    mockMutate.mockReset();
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
