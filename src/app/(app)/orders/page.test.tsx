/**
 * "Đơn hàng của tôi" (B3, QA vòng 2 N1): đơn còn mở phải tiếp tục thanh toán và hủy được; đơn đã
 * xong/đã quá hạn thì không còn nút hành động.
 */

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/services/order.service";
import MyOrdersPage from "./page";

const mockCancel = vi.fn();
const mockRefetch = vi.fn();
const mockCreateOrder = vi.fn();
const mockCheckPayment = vi.fn();
let mockOrders: Order[] = [];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/hooks/queries/use-orders", () => ({
  useMyOrders: () => ({
    data: { orders: mockOrders, total_count: mockOrders.length, page: 1, limit: 10, total_pages: 1 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
  }),
  useCancelOrder: () => ({ mutate: mockCancel, isPending: false }),
  useCreateOrder: () => ({ mutate: mockCreateOrder, isPending: false }),
  useCheckPayment: () => ({ mutateAsync: mockCheckPayment, isPending: false }),
  PAYMENT_RECONCILING_NOTICE: "Đơn đang được đối chiếu, bạn có thể đóng cửa sổ và xem lại tại Đơn hàng của tôi.",
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// Hộp thanh toán thật gọi API — ở đây chỉ cần biết trang mở nó cho ĐÚNG đơn.
vi.mock("@/components/checkout/order-payment-dialog", () => ({
  OrderPaymentDialog: ({ orderId, open }: { orderId: string | null; open: boolean }) =>
    open ? <div data-testid="payment-dialog">{orderId}</div> : null,
}));

function makeOrder(overrides: Partial<Order>): Order {
  return {
    id: "order-1",
    order_number: "ORD-QA-1",
    subtotal: 499000,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 499000,
    currency: "VND",
    status: "pending",
    items: [
      { id: "item-1", course_id: "course-1", course_name: "Lập trình Go", price: 499000, discount_amount: 0, final_price: 499000 },
    ],
    created_at: "2026-09-28T08:00:00+07:00",
    expires_at: new Date(Date.now() + 3 * 3600_000).toISOString(),
    ...overrides,
  };
}

describe("MyOrdersPage", () => {
  beforeEach(() => {
    mockCancel.mockReset();
    mockRefetch.mockReset();
    mockCreateOrder.mockReset();
    mockCheckPayment.mockReset();
    mockOrders = [];
  });

  // Review backend #76 MAJOR 2: đơn hết hạn (đã "expired" hoặc quá hạn giữ) → "Tạo đơn mới" cho
  // đúng các khóa của đơn đó, rồi mở thanh toán cho ĐƠN MỚI. Re-review vòng 2: đơn từng có mã phải
  // được backend đối chiếu lần cuối (check-payment) TRƯỚC khi tạo đơn mới.
  it("đơn hết hạn có nút Tạo đơn mới: đối chiếu trước, tạo đơn cho đúng khóa rồi mở thanh toán đơn mới", async () => {
    mockCheckPayment.mockResolvedValue({ order_id: "old-expired", status: "expired", amount: 499000 });
    mockOrders = [
      makeOrder({ id: "old-expired", status: "expired", expires_at: null }),
      makeOrder({ id: "done", order_number: "ORD-QA-2", status: "completed", expires_at: null }),
    ];
    render(<MyOrdersPage />);

    const buttons = screen.getAllByRole("button", { name: "Tạo đơn mới" });
    expect(buttons).toHaveLength(1);
    expect(screen.getByText(/Đơn đã hết hạn giữ chỗ/)).toBeTruthy();

    fireEvent.click(buttons[0]);
    await waitFor(() => expect(mockCreateOrder).toHaveBeenCalledTimes(1));
    expect(mockCheckPayment).toHaveBeenCalledWith("old-expired");
    const [dto, callbacks] = mockCreateOrder.mock.calls[0];
    expect(dto).toMatchObject({ source: "buy_now", course_ids: ["course-1"] });
    expect(typeof dto.idempotency_key).toBe("string");

    act(() => callbacks.onSuccess(makeOrder({ id: "order-new", status: "pending" })));
    expect(screen.getByTestId("payment-dialog").textContent).toBe("order-new");
  });

  it.each([
    ["đã thanh toán trong hạn", { status: "completed" }],
    ["nhận tiền sau hạn (chờ hoàn tiền)", { status: "expired", late_payment_received: true }],
    ["chưa xác minh được", { status: "processing" }],
  ])("đơn hết hạn từng có mã, backend báo %s → KHÔNG tạo đơn mới", async (_label, checked) => {
    mockCheckPayment.mockResolvedValue({ order_id: "had-code", amount: 499000, ...checked });
    mockOrders = [makeOrder({ id: "had-code", status: "expired", expires_at: null })];
    render(<MyOrdersPage />);

    fireEvent.click(screen.getByRole("button", { name: "Tạo đơn mới" }));
    await waitFor(() => expect(mockCheckPayment).toHaveBeenCalledWith("had-code"));
    await act(async () => {});
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  // Review #76 vòng 3: đơn processing quá hạn mã = đang đối chiếu. Chỉ có "Kiểm tra thanh toán":
  // hỏi backend rồi tải lại danh sách, TUYỆT ĐỐI không tạo đơn mới hay huỷ.
  it("đơn đang đối chiếu: Kiểm tra thanh toán gọi check-payment, tải lại, không tạo đơn / không huỷ", async () => {
    mockCheckPayment.mockResolvedValue({ order_id: "reconciling", status: "processing", amount: 499000, reconciling: true });
    mockOrders = [makeOrder({ id: "reconciling", status: "processing", expires_at: new Date(Date.now() - 60_000).toISOString() })];
    render(<MyOrdersPage />);

    expect(screen.getByText("Đang đối chiếu")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hủy đơn" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Tạo đơn mới" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra thanh toán" }));
    await waitFor(() => expect(mockCheckPayment).toHaveBeenCalledWith("reconciling"));
    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
    expect(mockCreateOrder).not.toHaveBeenCalled();
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it("hiện tên khóa, ngày tạo và 2 hành động cho đơn đang chờ", () => {
    mockOrders = [makeOrder({})];
    render(<MyOrdersPage />);

    expect(screen.getByText("Lập trình Go")).toBeTruthy();
    // Ngày tạo lấy đúng created_at của backend (giờ Việt Nam), không phải thời điểm render.
    expect(screen.getByText("08:00 28/09/2026")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tiếp tục thanh toán" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hủy đơn" })).toBeTruthy();
  });

  it("Tiếp tục thanh toán mở hộp thanh toán cho đúng đơn", () => {
    mockOrders = [makeOrder({ id: "order-processing", status: "processing" })];
    render(<MyOrdersPage />);

    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục thanh toán" }));
    expect(screen.getByTestId("payment-dialog").textContent).toBe("order-processing");
  });

  it("Hủy đơn phải xác nhận rồi mới gọi hủy đúng đơn", () => {
    mockOrders = [makeOrder({ id: "order-cancel" })];
    render(<MyOrdersPage />);

    fireEvent.click(screen.getByRole("button", { name: "Hủy đơn" }));
    expect(mockCancel).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Hủy đơn" }));
    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockCancel.mock.calls[0][0]).toBe("order-cancel");
  });

  it("đơn đã hoàn tất hoặc đã quá hạn giữ thì không còn nút hành động", () => {
    mockOrders = [
      makeOrder({ id: "done", status: "completed", expires_at: null }),
      makeOrder({ id: "late", order_number: "ORD-QA-2", expires_at: new Date(Date.now() - 60_000).toISOString() }),
    ];
    render(<MyOrdersPage />);

    expect(screen.queryByRole("button", { name: "Tiếp tục thanh toán" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hủy đơn" })).toBeNull();
    const cards = screen.getAllByRole("article");
    expect(within(cards[0]).getByText("Hoàn tất")).toBeTruthy();
    expect(within(cards[1]).getByText("Hết hạn")).toBeTruthy();
  });
});
