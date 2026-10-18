import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CheckoutSuccessPage from "./page";

const state = vi.hoisted(() => ({ id: "order-qa", status: "processing", amount: 100000 }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(state.id ? { order_id: state.id } : {}) }));
vi.mock("@/hooks/queries/use-orders", () => ({
  useOrder: () => ({ data: { id: state.id, status: state.status, total_amount: state.amount, order_number: "ORD-QA", items: [] }, isLoading: false, isError: false, refetch: vi.fn() }),
}));

describe("Checkout result uses confirmed server status", () => {
  it("does not claim payment or expose study CTA for an unpaid order", () => {
    state.id = "order-qa"; state.status = "processing"; state.amount = 100000;
    render(<CheckoutSuccessPage />);
    expect(screen.getByRole("heading", { name: "Đang chờ chuyển khoản" })).toBeTruthy();
    expect(screen.queryByText("Thanh toán thành công")).toBeNull();
    expect(screen.getByRole("link", { name: "Xem trạng thái đơn hàng" }).getAttribute("href")).toBe("/orders");
    expect(screen.queryByRole("link", { name: "Đi đến khoá học của tôi" })).toBeNull();
  });
  it("shows free enrollment only when completed", () => {
    state.status = "completed"; state.amount = 0;
    render(<CheckoutSuccessPage />);
    expect(screen.getByRole("heading", { name: "Đăng ký thành công" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Đi đến khoá học của tôi" }).getAttribute("href")).toBe("/my-courses");
  });
  it("handles a direct visit without an order ID", () => {
    state.id = "";
    render(<CheckoutSuccessPage />);
    expect(screen.getByRole("heading", { name: "Chưa có thông tin đơn hàng" })).toBeTruthy();
    expect(screen.queryByText("Thanh toán thành công")).toBeNull();
  });
});
