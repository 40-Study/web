/**
 * Q10 #148 H1: /my-vouchers tải được, rồi refetch nền lỗi: giữ danh sách voucher (kể cả danh sách RỖNG đã cache) + thông báo
 * 'Thử lại'. Trước đây im lặng.
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import MyVouchersPage from "./page";
import { ApiError } from "@/lib/errors";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { expectStaleNoticeWithRetry, refetchAllActiveQueries } from "@/test/stale-refetch";
import { renderWithProviders } from "@/test/utils";

const entry = {
  id: "s1", user_id: "u", voucher_id: "id-CONG", saved_at: "2026-10-01T00:00:00Z", source: "manual",
  voucher: { id: "id-CONG", code: "CONG", name: "CONG", discount_unit: "MONEY", discount_method: "FIXED", discount_amount_money: 50000, is_active: true, holders_only: false },
};

let failing = false;
let entries: unknown[] = [entry];
beforeEach(() => {
  resetMockApi();
  failing = false;
  entries = [entry];
  mockApi.get.mockImplementation(async () => {
    if (failing) throw new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
    return { data: { vouchers: entries, total_count: entries.length, limit: 20, offset: 0 } };
  });
});

describe("/my-vouchers — Q10 #148 H1", () => {
  it("refetch nền lỗi: còn voucher + thông báo 'Thử lại', không có hộp lỗi", async () => {
    const { queryClient } = renderWithProviders(<MyVouchersPage />);
    await screen.findByText("CONG");
    failing = true;
    await refetchAllActiveQueries(queryClient);
    await expectStaleNoticeWithRetry();
    expect(screen.getByText("CONG")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("danh sách RỖNG đã cache + refetch lỗi: vẫn là 'chưa có voucher' + thông báo, không phải hộp lỗi", async () => {
    entries = [];
    const { queryClient } = renderWithProviders(<MyVouchersPage />);
    await screen.findByText("Bạn chưa có voucher nào");
    failing = true;
    await refetchAllActiveQueries(queryClient);
    await expectStaleNoticeWithRetry();
    expect(screen.getByText("Bạn chưa có voucher nào")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("lần tải đầu lỗi: hộp lỗi, không có thông báo dữ liệu cũ", async () => {
    failing = true;
    renderWithProviders(<MyVouchersPage />);
    expect((await screen.findByRole("alert")).textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/Không làm mới được/)).toBeNull();
  });
});
