/** QA6-A07: ô tìm kiếm và ô chọn trạng thái của /admin/orders chỉ có placeholder / không có nhãn. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/orders",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/queries/use-admin-orders", () => ({
  useAdminOrders: () => ({
    data: { items: [], total_count: 0, total_pages: 1, page: 1 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

import AdminOrdersPage from "./page";

describe("/admin/orders — QA6-A07 tên truy cập", () => {
  it("ô tìm kiếm và ô chọn trạng thái có nhãn", () => {
    render(<AdminOrdersPage />);

    expect(screen.getByRole("textbox", { name: "Tìm đơn hàng" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Lọc theo trạng thái đơn hàng" })).toBeTruthy();
  });
});
