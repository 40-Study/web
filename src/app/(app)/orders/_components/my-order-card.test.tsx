/**
 * Review backend #76 vòng 3 (quyết định chủ dự án): đơn "processing" đã có mã chuyển khoản mà mã hết
 * hạn là đơn ĐANG ĐỐI CHIẾU với ngân hàng. Không cho "Hủy đơn" (backend cũng từ chối), không mời
 * "Tạo đơn mới" (backend chặn đơn trùng); chỉ giải thích và cho kiểm tra thanh toán.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Order } from "@/services/order.service";
import { MyOrderCard } from "./my-order-card";

function makeOrder(overrides: Partial<Order>): Order {
  return {
    id: "o1",
    order_number: "ORD-1",
    subtotal: 499000,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 499000,
    currency: "VND",
    status: "processing",
    items: [{ id: "i1", course_id: "c1", course_name: "Khóa A", price: 499000, discount_amount: 0, final_price: 499000 } as Order["items"][number]],
    created_at: "2026-09-28T00:00:00Z",
    ...overrides,
  };
}

function renderCard(order: Order) {
  const handlers = { onPay: vi.fn(), onCancel: vi.fn(), onReorder: vi.fn(), onCheckPayment: vi.fn() };
  render(<MyOrderCard order={order} {...handlers} />);
  return handlers;
}

const past = () => new Date(Date.now() - 60_000).toISOString();
const future = () => new Date(Date.now() + 3600_000).toISOString();

describe("MyOrderCard — đơn đang đối chiếu", () => {
  it("processing quá hạn mã: 'Đang đối chiếu', không Hủy đơn / Tạo đơn mới, có Kiểm tra thanh toán", () => {
    const order = makeOrder({ status: "processing", expires_at: past() });
    const { onCheckPayment } = renderCard(order);

    expect(screen.getByText("Đang đối chiếu")).toBeTruthy();
    expect(screen.getByText(/đang đối chiếu thanh toán của đơn này với ngân hàng/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hủy đơn" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Tạo đơn mới" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Tiếp tục thanh toán" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra thanh toán" }));
    expect(onCheckPayment).toHaveBeenCalledWith(order);
  });

  it("processing còn hạn mã: vẫn Hủy đơn / Tiếp tục thanh toán như cũ", () => {
    renderCard(makeOrder({ status: "processing", expires_at: future() }));
    expect(screen.getByRole("button", { name: "Hủy đơn" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tiếp tục thanh toán" })).toBeTruthy();
    expect(screen.queryByText("Đang đối chiếu")).toBeNull();
  });

  // Review #76 vòng 4 (phương án b): đơn đã cấp mã rồi huỷ vẫn được đối chiếu khi kiểm tra.
  it("đơn đã hủy từng có mã: có Kiểm tra thanh toán; đơn hủy chưa từng có mã thì không", () => {
    const withCode = makeOrder({ id: "c1", status: "cancelled", expires_at: null, payment_code_issued: true });
    const { onCheckPayment } = renderCard(withCode);
    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra thanh toán" }));
    expect(onCheckPayment).toHaveBeenCalledWith(withCode);
  });

  it("đơn đã hủy chưa từng có mã: không có Kiểm tra thanh toán", () => {
    renderCard(makeOrder({ status: "cancelled", expires_at: null }));
    expect(screen.queryByRole("button", { name: "Kiểm tra thanh toán" })).toBeNull();
  });

  // Review #76 final: đơn hết hạn từng có mã (chưa có cờ) có thể đang có tiền về → cho kiểm tra trước,
  // và câu "Tạo đơn mới" nhắc kiểm tra trước để không trả hai lần.
  it("đơn hết hạn từng có mã, chưa có cờ: Kiểm tra thanh toán + nhắc kiểm tra trước khi Tạo đơn mới", () => {
    const order = makeOrder({ status: "expired", expires_at: null, payment_code_issued: true });
    const { onCheckPayment, onReorder } = renderCard(order);
    expect(screen.getByText(/kiểm tra thanh toán trước khi tạo đơn mới/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra thanh toán" }));
    expect(onCheckPayment).toHaveBeenCalledWith(order);
    fireEvent.click(screen.getByRole("button", { name: "Tạo đơn mới" }));
    expect(onReorder).toHaveBeenCalledWith(order);
  });

  it("đơn hết hạn chưa từng có mã: không có Kiểm tra thanh toán", () => {
    renderCard(makeOrder({ status: "expired", expires_at: null }));
    expect(screen.queryByRole("button", { name: "Kiểm tra thanh toán" })).toBeNull();
    expect(screen.getByRole("button", { name: "Tạo đơn mới" })).toBeTruthy();
  });
});

// Quyết định chủ dự án (review #76 final): tiền về cho đơn đã đóng KHÔNG khôi phục đơn, chỉ gắn cờ.
describe("MyOrderCard — đơn đã đóng có cờ cần hoàn tiền", () => {
  it.each(["cancelled", "expired"] as const)("%s có refund_needed: dòng hoàn tiền, không nút kiểm tra", (status) => {
    renderCard(makeOrder({ status, expires_at: null, payment_code_issued: true, refund_needed: true }));
    expect(screen.getByText("Đã nhận tiền sau khi đơn đóng, ForteX sẽ hoàn tiền cho bạn")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Kiểm tra thanh toán" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Tạo đơn mới" })).toBeNull();
  });

  it("đơn chưa có cờ không hiện dòng hoàn tiền", () => {
    renderCard(makeOrder({ status: "cancelled", expires_at: null, payment_code_issued: true }));
    expect(screen.queryByText(/ForteX sẽ hoàn tiền/)).toBeNull();
  });
});

describe("MyOrderCard — pending", () => {
  it("pending quá hạn giữ (chưa từng có mã): vẫn là hết hạn + Tạo đơn mới", () => {
    const { onReorder } = renderCard(makeOrder({ status: "pending", expires_at: past() }));
    expect(screen.queryByText("Đang đối chiếu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tạo đơn mới" }));
    expect(onReorder).toHaveBeenCalledTimes(1);
  });
});
