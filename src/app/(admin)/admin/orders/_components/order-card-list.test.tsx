/** QA-C-21: ở màn hẹp mỗi đơn là một thẻ đủ tiền, trạng thái, ngày và nút Chi tiết (không còn bảng bị cắt cột). */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AdminOrderListItem } from "@/services/admin-order.service";
import { OrderCardList } from "./order-card-list";

const ORDER = {
  id: "o1",
  order_number: "ORD20261003123859feebf17c",
  user_email: "student1@demo.com",
  total_amount: 699000,
  status: "processing",
  created_at: "2026-10-03T12:38:00+07:00",
  items: [{ course_title: "Python cho Khoa học Dữ liệu" }],
} as unknown as AdminOrderListItem;

describe("OrderCardList", () => {
  it("thẻ có mã đơn, tiền, trạng thái, ngày giờ VN và link Chi tiết; chỉ hiện dưới sm", () => {
    render(<OrderCardList items={[ORDER]} />);
    const list = screen.getByRole("list", { name: "Danh sách đơn hàng" });
    expect(list.className).toContain("sm:hidden");
    const card = within(list).getByRole("listitem");
    expect(within(card).getByText("699.000đ")).toBeTruthy();
    expect(within(card).getByText("Đang chờ chuyển khoản")).toBeTruthy();
    expect(within(card).getByText("12:38 03/10/2026")).toBeTruthy();
    expect(within(card).getByRole("link", { name: "Chi tiết" }).getAttribute("href")).toBe("/admin/orders/o1");
  });
});
