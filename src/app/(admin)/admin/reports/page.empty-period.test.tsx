/** QA3-13: kỳ không có đơn đã có kết quả không được hiện "0.0%" (đọc như tỷ lệ thất bại). */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import AdminReportsPage from "./page";

vi.mock("@/hooks/queries/use-admin-reports", () => ({
  useAdminRevenueReport: () => ({
    data: {
      gross_revenue: 0,
      refund_amount: 0,
      net_revenue: 0,
      platform_fee_amount: 0,
      teacher_share_amount: 0,
      transaction_count: 0,
      completed_count: 0,
      refunded_count: 0,
      success_rate: 0,
      currency: "VND",
      by_status: {},
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  usePlatformFeeSetting: () => ({ data: { platform_fee_percent: 5 }, isLoading: false }),
}));

describe("AdminReportsPage — kỳ trống", () => {
  it("mẫu số 0: thẻ Tỷ lệ thành công hiện — thay vì 0.0%", () => {
    useAuthStore.setState({ sessionStatus: "authenticated", permissions: [] } as Partial<
      ReturnType<typeof useAuthStore.getState>
    >);
    render(<AdminReportsPage />);
    expect(screen.queryByText("0.0%")).toBeNull();
    expect(screen.getByText("Tỷ lệ thành công").parentElement?.textContent).toContain("—");
  });
});
