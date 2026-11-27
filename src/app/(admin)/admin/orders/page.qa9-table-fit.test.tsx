/**
 * QA9-ADMIN-02: ở 1280px bảng /admin/orders rộng 978px trong khung 942px (cuộn ngang 36px) nên nút "Chi tiết" bị cắt.
 * jsdom không đo được bề rộng, nên khoá hai nguyên nhân: ô "Khoá học" nối tên mọi khoá không giới hạn bề rộng, và
 * mọi ô dùng px-4 (cả 7 cột). Từ sm tới dưới 2xl dùng px-3 và ô Khoá học cắt bớt (đầy đủ ở `title`); từ 2xl trả px-4.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/orders",
  useSearchParams: () => new URLSearchParams(),
}));

const LONG_A = "Lập trình Python từ cơ bản đến nâng cao dành cho người mới bắt đầu";
const LONG_B = "Toán tư duy lớp 5 chuyên sâu";
const ORDER = {
  id: "o-1",
  order_number: "ORD-1",
  user_email: "hocvien@example.com",
  items: [{ course_title: LONG_A }, { course_title: LONG_B }],
  total_amount: 1000000,
  status: "completed",
  refund_needed: false,
  created_at: "2026-11-20T10:00:00Z",
};
vi.mock("@/hooks/queries/use-admin-orders", () => ({
  useAdminOrders: () => ({
    data: { items: [ORDER], total_count: 1, total_pages: 1, page: 1 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

import AdminOrdersPage from "./page";

describe("/admin/orders — QA9-ADMIN-02 bảng vừa khung ở 1280px", () => {
  it("ô Khoá học bị giới hạn bề rộng và cắt bớt, tên đầy đủ nằm ở title", () => {
    render(<AdminOrdersPage />);
    const cell = screen.getAllByText(`${LONG_A}, ${LONG_B}`).find((el) => el.tagName === "TD");
    expect(cell, "ô Khoá học của bảng desktop").toBeTruthy();
    const tokens = cell!.className.split(/\s+/);
    expect(tokens).toContain("truncate");
    expect(tokens.some((t) => t.startsWith("max-w-"))).toBe(true);
    expect(cell!.getAttribute("title")).toBe(`${LONG_A}, ${LONG_B}`);
  });

  it("mọi ô và tiêu đề của bảng dùng px-3, chỉ từ 2xl mới px-4", () => {
    const { container } = render(<AdminOrdersPage />);
    const cells = container.querySelectorAll("table th, table td");
    expect(cells.length).toBe(14);
    for (const cell of cells) {
      const tokens = cell.className.split(/\s+/);
      expect(tokens, cell.textContent ?? "").toContain("px-3");
      expect(tokens).toContain("2xl:px-4");
      expect(tokens).not.toContain("px-4");
    }
  });

  it("đơn không có khoá học thì hiện '-' và không có title rỗng", () => {
    ORDER.items = [];
    const { container } = render(<AdminOrdersPage />);
    const cell = container.querySelectorAll("table tbody td")[2];
    expect(cell.textContent).toBe("-");
    expect(cell.hasAttribute("title")).toBe(false);
    ORDER.items = [{ course_title: LONG_A }, { course_title: LONG_B }];
  });
});
