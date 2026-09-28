/**
 * Review backend #76 MAJOR 2: backend từ chối mở phiên thanh toán cho đơn quá hạn giữ (409
 * ERR_ORDER_EXPIRED). Hộp thanh toán phải báo "đơn hết hạn" bằng câu của backend và cho tạo đơn
 * mới, không hiện màn lỗi chung "Giao dịch không thành công".
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/services/order.service", () => ({
  orderService: { createPaymentIntent: vi.fn(), getPaymentStatus: vi.fn(), checkPayment: vi.fn() },
}));

import { orderService } from "@/services/order.service";
import { OrderPaymentDialog } from "./order-payment-dialog";

const EXPIRED_MSG = "Đơn hàng đã hết hạn giữ chỗ. Vui lòng tạo đơn mới để thanh toán theo giá hiện tại.";

function renderDialog(orderId: string, onRetryExpired = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const ui = (id: string) => (
    <QueryClientProvider client={qc}>
      <OrderPaymentDialog
        orderId={id}
        amount={499000}
        open
        onOpenChange={vi.fn()}
        onPaid={vi.fn()}
        onRetryExpired={onRetryExpired}
      />
    </QueryClientProvider>
  );
  const view = render(ui(orderId));
  return { ...view, rerenderWith: (id: string) => view.rerender(ui(id)), onRetryExpired };
}

describe("OrderPaymentDialog — đơn hết hạn", () => {
  beforeEach(() => {
    vi.mocked(orderService.createPaymentIntent).mockReset();
  });

  it("409 ERR_ORDER_EXPIRED: hiện câu của backend và nút 'Tạo đơn mới'", async () => {
    vi.mocked(orderService.createPaymentIntent).mockRejectedValue(new ApiError(409, "ERR_ORDER_EXPIRED", EXPIRED_MSG));
    const { onRetryExpired } = renderDialog("order-old");

    await waitFor(() => expect(screen.getByText("Đơn hàng đã hết hạn")).toBeTruthy());
    expect(screen.getByText(EXPIRED_MSG)).toBeTruthy();
    expect(screen.queryByText("Giao dịch không thành công")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Tạo đơn mới" }));
    expect(onRetryExpired).toHaveBeenCalledTimes(1);
  });

  it("đổi sang đơn mới thì bỏ màn hết hạn của đơn cũ và hiện mã chuyển khoản của đơn mới", async () => {
    vi.mocked(orderService.createPaymentIntent)
      .mockRejectedValueOnce(new ApiError(409, "ERR_ORDER_EXPIRED", EXPIRED_MSG))
      .mockResolvedValueOnce({
        order_id: "order-new",
        payment_code: "PAYNEW123",
        amount: 299000,
        currency: "VND",
        expired_at: new Date(Date.now() + 3600_000).toISOString(),
        bank_transfer_info: { bank_name: "MB", account_number: "123", account_name: "40STUDY", content: "40STUDY PAYNEW123" },
      });
    const { rerenderWith } = renderDialog("order-old");
    await waitFor(() => expect(screen.getByText("Đơn hàng đã hết hạn")).toBeTruthy());

    rerenderWith("order-new");
    await waitFor(() => expect(screen.getByText("40STUDY PAYNEW123")).toBeTruthy());
    expect(screen.queryByText("Đơn hàng đã hết hạn")).toBeNull();
    expect(vi.mocked(orderService.createPaymentIntent).mock.calls[1][0]).toBe("order-new");
  });

  it("lỗi khác vẫn là màn lỗi chung", async () => {
    vi.mocked(orderService.createPaymentIntent).mockRejectedValue(new ApiError(400, "ERR_CREATE_PAYMENT", "invalid state transition"));
    renderDialog("order-x");
    await waitFor(() => expect(screen.getByText("Giao dịch không thành công")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Tạo đơn mới" })).toBeNull();
  });
});
