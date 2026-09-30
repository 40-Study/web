/**
 * Review backend #76 final (quyết định chủ dự án): tiền về cho đơn đã huỷ/hết hạn không khôi phục
 * đơn, backend gắn cờ refund_needed. Danh sách đơn admin hiện badge "Cần hoàn tiền" cho đúng đơn đó.
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AdminOrderListItem } from "@/services/admin-order.service";
import AdminOrdersPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/orders",
  useSearchParams: () => new URLSearchParams(""),
}));

function item(overrides: Partial<AdminOrderListItem>): AdminOrderListItem {
  return {
    id: "o",
    order_number: "ORD",
    user_id: "u1",
    user_email: "hv@40study.test",
    total_amount: 499000,
    currency: "VND",
    status: "cancelled",
    created_at: "2026-09-28T01:00:00Z",
    items: [{ course_id: "c1", course_title: "Khóa A", final_price: 499000 }],
    ...overrides,
  };
}

const mockItems: AdminOrderListItem[] = [
  item({ id: "flagged", order_number: "ORD-FLAGGED", refund_needed: true }),
  item({ id: "plain", order_number: "ORD-PLAIN", status: "expired" }),
  // Admin đã ghi nhận chuyển khoản hoàn: cờ tắt, có mốc late_refunded_at.
  item({ id: "done", order_number: "ORD-DONE", refund_needed: false, late_refunded_at: "2026-09-30T08:00:00Z" }),
];

vi.mock("@/hooks/queries/use-admin-orders", () => ({
  useAdminOrders: () => ({
    data: { items: mockItems, total_count: mockItems.length, page: 1, limit: 20, total_pages: 1 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe("AdminOrdersPage — badge Cần hoàn tiền", () => {
  it("chỉ đơn có refund_needed hiện badge", () => {
    render(<AdminOrdersPage />);
    const flaggedRow = screen.getByText("ORD-FLAGGED").closest("tr")!;
    const plainRow = screen.getByText("ORD-PLAIN").closest("tr")!;
    expect(within(flaggedRow).getByText("Cần hoàn tiền")).toBeTruthy();
    expect(within(plainRow).queryByText("Cần hoàn tiền")).toBeNull();
  });

  it("đơn admin đã ghi nhận hoàn: badge đổi thành Đã hoàn tiền, không còn Cần hoàn tiền", () => {
    render(<AdminOrdersPage />);
    const doneRow = screen.getByText("ORD-DONE").closest("tr")!;
    expect(within(doneRow).getByText("Đã hoàn tiền")).toBeTruthy();
    expect(within(doneRow).queryByText("Cần hoàn tiền")).toBeNull();
    // Đơn có cờ hoặc chưa từng có tiền về không mang nhãn "Đã hoàn tiền".
    expect(within(screen.getByText("ORD-FLAGGED").closest("tr")!).queryByText("Đã hoàn tiền")).toBeNull();
    expect(within(screen.getByText("ORD-PLAIN").closest("tr")!).queryByText("Đã hoàn tiền")).toBeNull();
  });
});
