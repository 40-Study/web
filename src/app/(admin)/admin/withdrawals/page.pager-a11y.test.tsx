/** QA6-A07: nút trang trước/sau của /admin/withdrawals chỉ có icon, không có tên. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/withdrawals",
  useSearchParams: () => new URLSearchParams("page=2"),
}));

vi.mock("@/hooks/queries/use-wallet", () => ({
  useAdminWithdrawals: () => ({
    data: {
      items: [
        {
          id: "wd-1",
          amount: 500000,
          currency: "VND",
          status: "pending",
          rejection_reason: null,
          transaction_id: null,
          bank_name: "Vietcombank",
          bank_account_number: "0123456789",
          bank_account_name: "NGUYEN VAN A",
          created_at: "2026-09-27T00:00:00Z",
          processed_at: null,
          teacher_id: "t-1",
          teacher_name: "Nguyễn Văn A",
          teacher_email: "a@40study.vn",
          teacher_available_balance: 400000,
        },
      ],
      total_count: 50,
      page: 2,
      limit: 20,
      total_pages: 3,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useAdminNegativeBalances: () => ({ data: [], isError: false }),
  useAdminApproveWithdrawal: () => ({ mutate: vi.fn(), isPending: false }),
  useAdminRejectWithdrawal: () => ({ mutate: vi.fn(), isPending: false }),
  useAdminMarkWithdrawalCompleted: () => ({ mutate: vi.fn(), isPending: false }),
}));

import AdminWithdrawalsPage from "./page";

describe("/admin/withdrawals — QA6-A07 phân trang có tên", () => {
  it("nút trước/sau có aria-label và bật khi đang ở trang giữa", () => {
    render(<AdminWithdrawalsPage />);

    expect((screen.getByRole("button", { name: "Trang trước" }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: "Trang sau" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
