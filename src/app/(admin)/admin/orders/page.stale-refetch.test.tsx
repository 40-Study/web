/**
 * Q10-ADMIN-01: /admin/orders tải được, rồi refetch nền lỗi 500: giữ bảng đơn hàng đã có + báo gọn "Thử lại",
 * không thay cả bảng bằng hộp lỗi. Lần tải đầu lỗi vẫn là hộp lỗi đầy đủ.
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/orders",
  useSearchParams: () => new URLSearchParams(),
}));

import AdminOrdersPage from "./page";
import { ApiError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { expectStaleNoticeWithRetry, refetchAllActiveQueries } from "@/test/stale-refetch";
import { renderWithProviders } from "@/test/utils";

const ORDER = {
  id: "o-1",
  order_number: "ORD-STALE-1",
  user_email: "hocvien@example.com",
  items: [{ course_title: "Toán tư duy lớp 5" }],
  total_amount: 1000000,
  status: "completed",
  refund_needed: false,
  created_at: "2026-11-20T10:00:00Z",
};

let failing = false;
beforeEach(() => {
  resetMockApi();
  failing = false;
  mockApi.get.mockImplementation(async () => {
    if (failing) throw new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
    return envelope({ items: [ORDER], total_count: 1, total_pages: 1, page: 1 });
  });
});

describe("/admin/orders — Q10-ADMIN-01", () => {
  it("refetch nền lỗi: bảng đơn còn nguyên + thông báo 'Thử lại', không có hộp lỗi", async () => {
    const { queryClient } = renderWithProviders(<AdminOrdersPage />);
    await screen.findAllByText("ORD-STALE-1");

    failing = true;
    await refetchAllActiveQueries(queryClient);

    await expectStaleNoticeWithRetry();
    expect(screen.getAllByText("ORD-STALE-1").length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("lần tải đầu lỗi: hộp lỗi đầy đủ", async () => {
    failing = true;
    renderWithProviders(<AdminOrdersPage />);
    expect((await screen.findByRole("alert")).textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/Không cập nhật được dữ liệu mới/)).toBeNull();
  });
});
