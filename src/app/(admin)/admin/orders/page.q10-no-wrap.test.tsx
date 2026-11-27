/**
 * Q10-ADMIN-02: ở 1280px "Chi tiết" không còn bị cắt nhưng xuống hai dòng ("Chi" / "tiết", ô 27px rộng, cao 41px) ở cả
 * 20 dòng, và tiêu đề "Trạng thái" cũng xuống dòng (cao 68px). Nguyên nhân: không có `whitespace-nowrap`. jsdom không dàn
 * trang nên khoá nguyên nhân; số đo Chromium trước/sau nằm ở mô tả PR (bảng vẫn vừa khung 940px).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/orders",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/queries/use-admin-orders", () => ({
  useAdminOrders: () => ({
    data: {
      items: [
        { id: "o-1", order_number: "ORD-1", user_email: "a@example.com", items: [], total_amount: 1000, status: "completed", refund_needed: false, created_at: "2026-11-20T10:00:00Z" },
      ],
      total_count: 1,
      total_pages: 1,
      page: 1,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

import AdminOrdersPage from "./page";

describe("/admin/orders — Q10-ADMIN-02 không xuống dòng trong ô hẹp", () => {
  it('liên kết "Chi tiết" của bảng là whitespace-nowrap', () => {
    const { container } = render(<AdminOrdersPage />);
    const link = container.querySelector("table")!.querySelector('a[href="/admin/orders/o-1"]')!;
    expect(link.textContent).toBe("Chi tiết");
    expect(link.className.split(/\s+/)).toContain("whitespace-nowrap");
  });

  it('tiêu đề cột "Trạng thái" là whitespace-nowrap', () => {
    render(<AdminOrdersPage />);
    const th = screen.getByRole("columnheader", { name: "Trạng thái" });
    expect(th.className.split(/\s+/)).toContain("whitespace-nowrap");
  });
});
