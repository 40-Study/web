/**
 * Backend#143 Q8: nút "Tôi đã chuyển khoản" PHẢI gọi POST /orders/:id/check-payment (không phải chỉ poll
 * payment-status): chỉ lời gọi đó ghi nhận chủ đơn đã báo chuyển khoản, và nó quyết định kết quả huỷ đơn khi ngân hàng lỗi.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/services/order.service", () => ({
  orderService: { createPaymentIntent: vi.fn(), getPaymentStatus: vi.fn(), checkPayment: vi.fn() },
}));

import { orderService } from "@/services/order.service";
import { OrderPaymentDialog } from "./order-payment-dialog";

const intent = (bank: boolean) => ({
  amount: 499000,
  payment_code: "FTX123",
  expired_at: new Date(Date.now() + 30 * 60_000).toISOString(),
  bank_transfer_info: bank
    ? { bank_name: "MB Bank", account_number: "0123456789", account_name: "FORTEX", content: "FTX123" }
    : undefined,
});

function renderDialog() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <OrderPaymentDialog orderId="order-1" amount={499000} open onOpenChange={vi.fn()} onPaid={vi.fn()} onRetryExpired={vi.fn()} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.mocked(orderService.createPaymentIntent).mockReset();
  vi.mocked(orderService.getPaymentStatus).mockReset().mockResolvedValue({ status: "processing" } as never);
  vi.mocked(orderService.checkPayment).mockReset().mockResolvedValue({ status: "processing" } as never);
});

describe("OrderPaymentDialog — 'Tôi đã chuyển khoản'", () => {
  it("gọi orderService.checkPayment(orderId)", async () => {
    vi.mocked(orderService.createPaymentIntent).mockResolvedValue(intent(true) as never);
    renderDialog();
    const button = await screen.findByRole("button", { name: "Tôi đã chuyển khoản" });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(button);
    await waitFor(() => expect(orderService.checkPayment).toHaveBeenCalledWith("order-1"));
  });

  it("backend không trả thông tin ngân hàng: nút khoá và không gọi checkPayment", async () => {
    vi.mocked(orderService.createPaymentIntent).mockResolvedValue(intent(false) as never);
    renderDialog();
    const button = (await screen.findByRole("button", { name: "Tôi đã chuyển khoản" })) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(orderService.checkPayment).not.toHaveBeenCalled();
  });
});
