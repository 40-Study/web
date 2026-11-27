/**
 * QA9-ADMIN-02: ở 1280px bảng /admin/orders rộng 978px trong khung 940px (cuộn ngang) nên nút "Chi tiết" bị cắt.
 * jsdom không dàn trang nên không đo được bề rộng; test này khoá NGUYÊN NHÂN đã đo ở Chromium, không khoá riêng tên lớp:
 *  - `truncate` (nowrap) TRÊN <td> đặt bề rộng tối thiểu của cột bằng max-width => ô Khoá học 256px không co được, bảng
 *    rộng 1039px (lần sửa đầu, thất bại). Chữ phải xuống dòng và bị cắt bởi `line-clamp` ở div BÊN TRONG ô.
 *  - Cột Mã đơn / Học viên bị chặn bề rộng (cắt bằng `truncate` + `title`) để email dài và mã đơn 25 ký tự vẫn vừa khung.
 * Số đo (Chromium, khung 940px, 8 dòng): xem mô tả PR. Tại 1280px: dữ liệu giống QA 1039 -> 940, dữ liệu email dài 1155 -> 940.
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
  it("ô Khoá học KHÔNG nowrap: chữ xuống dòng, cắt 2 dòng trong div, tên đầy đủ ở title", () => {
    render(<AdminOrdersPage />);
    const cell = screen.getAllByText(`${LONG_A}, ${LONG_B}`).find((el) => el.closest("td"))!.closest("td")!;
    const tokens = cell.className.split(/\s+/);
    // Chính 2 lớp này làm bảng rộng thêm 99px ở 1280 khi nằm trên <td>.
    expect(tokens).not.toContain("truncate");
    expect(tokens).not.toContain("whitespace-nowrap");
    expect(tokens.some((t) => t.startsWith("max-w-"))).toBe(true);
    expect(cell.getAttribute("title")).toBe(`${LONG_A}, ${LONG_B}`);
    const inner = cell.firstElementChild as HTMLElement;
    expect(inner.tagName).toBe("DIV");
    expect(inner.className.split(/\s+/)).toContain("line-clamp-2");
    expect(inner.className).not.toMatch(/truncate|whitespace-nowrap/);
  });

  it("Mã đơn và Học viên bị chặn bề rộng, cắt bằng truncate và giữ giá trị đầy đủ ở title", () => {
    ORDER.order_number = "ORD20261124100132d4f1214c";
    ORDER.user_email = "nguyen.van.hoc.vien.rat.dai.ten@example.com";
    const { container } = render(<AdminOrdersPage />);
    const [orderCell, emailCell] = Array.from(container.querySelectorAll("table tbody td")) as HTMLElement[];
    for (const [cell, full] of [[orderCell, ORDER.order_number], [emailCell, ORDER.user_email]] as const) {
      const tokens = cell.className.split(/\s+/);
      expect(tokens, full).toContain("truncate");
      expect(tokens.some((t) => /^max-w-\[\d+(\.\d+)?rem\]$/.test(t)), full).toBe(true);
      expect(cell.getAttribute("title")).toBe(full);
    }
    ORDER.order_number = "ORD-1";
    ORDER.user_email = "hocvien@example.com";
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
