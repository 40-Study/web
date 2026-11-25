/** QA7-A04: liên kết quay lại chỉ có icon phải có tên cho trình đọc màn hình. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "order-1" }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/hooks/queries/use-admin-orders", () => ({
  useAdminOrder: () => ({
    data: {
      id: "order-1", order_number: "ORD-TEST-1", status: "completed", total_amount: 699000, currency: "VND",
      payment_method: "bank_transfer", created_at: "2026-09-28T00:00:00Z", paid_at: "2026-09-28T00:01:00Z", items: [],
    },
    isLoading: false, isError: false, error: null, refetch: vi.fn(),
  }),
  useRefundOrder: () => ({ mutate: vi.fn(), isPending: false }),
  useMarkLateRefunded: () => ({ mutate: vi.fn(), isPending: false }),
}));

import AdminOrderDetailPage from "./page";

describe("/admin/orders/[id] — QA7-A04 liên kết quay lại có tên", () => {
  it("liên kết icon về danh sách có tên truy cập và trỏ tới /admin/orders", () => {
    render(<AdminOrderDetailPage />);
    expect(screen.getByRole("link", { name: "Về danh sách đơn hàng" }).getAttribute("href")).toBe("/admin/orders");
  });
});
