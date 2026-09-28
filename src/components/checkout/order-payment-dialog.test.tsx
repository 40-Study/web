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
import { PAYMENT_FINAL_CHECK_WINDOW_MS, PAYMENT_RECONCILING_NOTICE } from "@/hooks/queries/use-orders";
import { OrderPaymentDialog } from "./order-payment-dialog";

const EXPIRED_MSG = "Đơn hàng đã hết hạn giữ chỗ. Vui lòng tạo đơn mới để thanh toán theo giá hiện tại.";

function renderDialog(orderId: string, onRetryExpired = vi.fn(), onPaid = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const ui = (id: string) => (
    <QueryClientProvider client={qc}>
      <OrderPaymentDialog
        orderId={id}
        amount={499000}
        open
        onOpenChange={vi.fn()}
        onPaid={onPaid}
        onRetryExpired={onRetryExpired}
      />
    </QueryClientProvider>
  );
  const view = render(ui(orderId));
  return { ...view, rerenderWith: (id: string) => view.rerender(ui(id)), onRetryExpired, onPaid };
}

const VERIFYING_MSG = "Đơn hàng đang được đối chiếu thanh toán với ngân hàng. Vui lòng không chuyển khoản lại và thử lại sau ít phút.";

// Review #76 vòng 3: đơn đã thanh toán / đang đối chiếu không được mời "Tạo đơn mới".
describe("OrderPaymentDialog — đối chiếu ngân hàng", () => {
  beforeEach(() => {
    vi.mocked(orderService.createPaymentIntent).mockReset();
    vi.mocked(orderService.getPaymentStatus).mockReset();
    vi.mocked(orderService.checkPayment).mockReset();
  });

  it("409 ERR_ORDER_ALREADY_PAID: màn thành công và gọi onPaid", async () => {
    vi.mocked(orderService.createPaymentIntent).mockRejectedValue(
      new ApiError(409, "ERR_ORDER_ALREADY_PAID", "Đơn hàng đã được thanh toán, khóa học đã được thêm vào tài khoản của bạn.")
    );
    const { onPaid } = renderDialog("order-paid");

    await waitFor(() => expect(screen.getByText("Thanh toán thành công!")).toBeTruthy());
    expect(onPaid).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Tạo đơn mới" })).toBeNull();
  });

  it("409 ERR_PAYMENT_VERIFYING: màn đang đối chiếu, 'Kiểm tra lại' ra thành công", async () => {
    vi.mocked(orderService.createPaymentIntent).mockRejectedValue(new ApiError(409, "ERR_PAYMENT_VERIFYING", VERIFYING_MSG));
    vi.mocked(orderService.checkPayment).mockResolvedValue({ order_id: "order-v", status: "completed", amount: 499000 });
    const { onPaid } = renderDialog("order-v");

    await waitFor(() => expect(screen.getByText("Đang đối chiếu thanh toán")).toBeTruthy());
    expect(screen.getByText(VERIFYING_MSG)).toBeTruthy();
    expect(screen.getByText(PAYMENT_RECONCILING_NOTICE)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Tạo đơn mới" })).toBeNull();
    expect(screen.queryByText("Giao dịch không thành công")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra lại" }));
    await waitFor(() => expect(screen.getByText("Thanh toán thành công!")).toBeTruthy());
    expect(orderService.checkPayment).toHaveBeenCalledWith("order-v");
    expect(onPaid).toHaveBeenCalledTimes(1);
  });

  it("quá hạn mã + cửa sổ poll mà server vẫn processing: báo đang đối chiếu, chỉ chỗ xem lại", async () => {
    vi.mocked(orderService.createPaymentIntent).mockResolvedValue({
      order_id: "order-slow", payment_code: "PAYSLOW", amount: 499000, currency: "VND",
      expired_at: new Date(Date.now() - PAYMENT_FINAL_CHECK_WINDOW_MS - 1000).toISOString(),
    });
    vi.mocked(orderService.getPaymentStatus).mockResolvedValue({ order_id: "order-slow", status: "processing", amount: 499000, reconciling: true });
    renderDialog("order-slow");

    await waitFor(() => expect(screen.getByText(PAYMENT_RECONCILING_NOTICE)).toBeTruthy());
    expect(screen.queryByText(/đang kiểm tra lần cuối/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Tạo đơn mới" })).toBeNull();
  });
});

describe("OrderPaymentDialog — đơn hết hạn", () => {
  beforeEach(() => {
    vi.mocked(orderService.createPaymentIntent).mockReset();
    vi.mocked(orderService.getPaymentStatus).mockReset();
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

  // Re-review #76 vòng 2: hết giờ trên đồng hồ chưa phải hết hạn thật. Server còn đối chiếu lần
  // cuối; tiền về SAU hạn → báo hoàn tiền, KHÔNG có nút "Tạo đơn mới" (tránh trả lần 2).
  it("hết giờ mà server chưa chốt: hiện đang kiểm tra lần cuối, không mời tạo đơn mới", async () => {
    vi.mocked(orderService.createPaymentIntent).mockResolvedValue({
      order_id: "order-late", payment_code: "PAYLATE", amount: 499000, currency: "VND",
      expired_at: new Date(Date.now() - 1000).toISOString(),
      bank_transfer_info: { bank_name: "MB", account_number: "123", account_name: "40STUDY", content: "40STUDY PAYLATE" },
    });
    vi.mocked(orderService.getPaymentStatus).mockResolvedValue({ order_id: "order-late", status: "processing", amount: 499000 });
    renderDialog("order-late");

    await waitFor(() => expect(screen.getByText(/đang kiểm tra lần cuối/)).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Tạo đơn mới" })).toBeNull();
  });

  it("server báo đã nhận tiền sau hạn: báo hoàn tiền, không có nút Tạo đơn mới", async () => {
    vi.mocked(orderService.createPaymentIntent).mockResolvedValue({
      order_id: "order-late2", payment_code: "PAYLATE2", amount: 499000, currency: "VND",
      expired_at: new Date(Date.now() - 1000).toISOString(),
    });
    vi.mocked(orderService.getPaymentStatus).mockResolvedValue({
      order_id: "order-late2", status: "expired", amount: 499000, late_payment_received: true,
    });
    renderDialog("order-late2");

    await waitFor(() => expect(screen.getByText("Đã nhận tiền sau khi đơn hết hạn")).toBeTruthy());
    expect(screen.getByText(/Bộ phận hỗ trợ sẽ liên hệ hoàn tiền/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Tạo đơn mới" })).toBeNull();
  });

  it("lỗi khác vẫn là màn lỗi chung", async () => {
    vi.mocked(orderService.createPaymentIntent).mockRejectedValue(new ApiError(400, "ERR_CREATE_PAYMENT", "invalid state transition"));
    renderDialog("order-x");
    await waitFor(() => expect(screen.getByText("Giao dịch không thành công")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Tạo đơn mới" })).toBeNull();
  });
});
