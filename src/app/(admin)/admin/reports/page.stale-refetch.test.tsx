/**
 * Q11-ADMIN-01: /admin/reports tải được, rời trang rồi quay lại, refetch báo cáo lỗi: phải giữ thẻ doanh thu cũ + MỘT thông
 * báo 'Thử lại', không phải hộp lỗi thay dữ liệu. Trước đây khoảng thời gian tính theo từng giây nên mỗi lần mount ra khoá
 * query mới, không có cache để giữ. Dùng hook THẬT (không mock) với mockApi.
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import AdminReportsPage from "./page";
import { ApiError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { createTestQueryClient, renderWithProviders } from "@/test/utils";
import { expectStaleNoticeWithRetry } from "@/test/stale-refetch";

const report = {
  gross_revenue: 1746400, refund_amount: 249000, net_revenue: 1497400, platform_fee_amount: 87320, teacher_share_amount: 1410080,
  transaction_count: 7, completed_count: 4, refunded_count: 1, success_rate: 80, currency: "VND",
  by_status: { pending: 0, processing: 1, completed: 4, failed: 0, refunded: 1, cancelled: 1, expired: 0 },
};

let failing = false;
beforeEach(() => {
  resetMockApi();
  failing = false;
  useAuthStore.setState({ sessionStatus: "authenticated", permissions: ["SYSTEM_SETTINGS_MANAGE"] });
  mockApi.get.mockImplementation(async (url: string) => {
    if (url.includes("platform-fee")) return envelope({ platform_fee_percent: 5 });
    if (failing) throw new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
    return envelope(report);
  });
});

const revenueCalls = () => mockApi.get.mock.calls.filter(([url]) => String(url).includes("reports/revenue"));

describe("/admin/reports — Q11-ADMIN-01", () => {
  it("mount lại (rời trang rồi quay lại) dùng đúng khoá cache cũ: gọi API với cùng from/to", async () => {
    const queryClient = createTestQueryClient();
    const first = renderWithProviders(<AdminReportsPage />, { queryClient });
    await screen.findByText(/1\.746\.400/);
    first.unmount();
    await new Promise((r) => setTimeout(r, 1100)); // qua ranh giới giây: khoá cũ (tính theo giây) sẽ khác
    renderWithProviders(<AdminReportsPage />, { queryClient });
    await screen.findByText(/1\.746\.400/);
    const params = revenueCalls().map(([, cfg]) => JSON.stringify((cfg as { params: unknown }).params));
    expect(params.length).toBeGreaterThanOrEqual(1);
    expect(new Set(params).size).toBe(1);
  });

  it("quay lại trang rồi refetch lỗi: còn thẻ doanh thu + thông báo 'Thử lại', không có hộp lỗi", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 0, gcTime: 60_000 } });
    const first = renderWithProviders(<AdminReportsPage />, { queryClient });
    await screen.findByText(/1\.746\.400/);
    first.unmount();
    await new Promise((r) => setTimeout(r, 1100));

    failing = true;
    renderWithProviders(<AdminReportsPage />, { queryClient });
    await expectStaleNoticeWithRetry();
    expect(screen.getByText(/1\.746\.400/)).toBeTruthy();
    expect(screen.queryByText("Không thể tải dữ liệu")).toBeNull();
  });
});
