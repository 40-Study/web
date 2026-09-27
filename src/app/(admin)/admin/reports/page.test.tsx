/**
 * /admin/reports must read the REAL platform revenue report (useAdminRevenueReport), not the
 * caller's own wallet transactions (useWalletTransactions) — the bug this phase replaces
 * (qa-260927-admin.md: "/admin/reports = ví của admin, không phải doanh thu nền tảng").
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import AdminReportsPage from "./page";

vi.mock("@/hooks/queries/use-admin-reports", () => ({
  useAdminRevenueReport: () => ({
    data: {
      gross_revenue: 1746400,
      refund_amount: 249000,
      net_revenue: 1497400,
      platform_fee_amount: 87320,
      teacher_share_amount: 1659080,
      transaction_count: 7,
      completed_count: 4,
      refunded_count: 1,
      success_rate: 80,
      currency: "VND",
      by_status: {
        pending: 0,
        processing: 1,
        completed: 4,
        failed: 0,
        refunded: 1,
        cancelled: 1,
        expired: 0,
      },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  usePlatformFeeSetting: () => ({ data: { platform_fee_percent: 5 }, isLoading: false }),
  useUpdatePlatformFeeSetting: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("AdminReportsPage — real platform revenue report", () => {
  beforeEach(() => {
    useAuthStore.setState({
      sessionStatus: "authenticated",
      permissions: ["SYSTEM_SETTINGS_MANAGE"],
    } as Partial<ReturnType<typeof useAuthStore.getState>>);
  });

  it("renders gross/refund/net/platform-fee/teacher-share from the real report, not wallet data", () => {
    render(<AdminReportsPage />);

    // gross_revenue = 1,746,400 (not the wallet-transactions-derived number the old page computed)
    // getByText throws if not found, so a truthy result already proves presence.
    expect(screen.getByText(/1\.746\.400/)).toBeTruthy();
    // refund_amount is a REAL field now, not "cancelled" mislabeled as refunded.
    expect(screen.getByText(/249\.000/)).toBeTruthy();
    // platform_fee_amount / teacher_share_amount — new fields from decision #2.
    expect(screen.getByText(/87\.320/)).toBeTruthy();
    expect(screen.getByText(/1\.659\.080/)).toBeTruthy();
    expect(screen.getByText("80.0%")).toBeTruthy();
  });

  it("shows the configured platform fee percentage", () => {
    render(<AdminReportsPage />);
    expect(screen.getByText("5%")).toBeTruthy();
  });
});
