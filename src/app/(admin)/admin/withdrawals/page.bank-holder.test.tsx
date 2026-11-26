/** QA8-A12: yêu cầu rút có tên chủ tài khoản trống không được in dấu gạch treo ("1260866135 — "). */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import type { AdminWithdrawalItem } from "@/services/wallet.service";

let mockItems: AdminWithdrawalItem[] = [];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/withdrawals",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/queries/use-wallet", () => ({
  useAdminWithdrawals: () => ({
    data: { items: mockItems, total_count: mockItems.length, page: 1, limit: 20, total_pages: 1 },
    isLoading: false, isError: false, error: null, refetch: vi.fn(),
  }),
  useAdminNegativeBalances: () => ({ data: [], isError: false }),
  useAdminApproveWithdrawal: () => ({ mutate: vi.fn(), isPending: false }),
  useAdminRejectWithdrawal: () => ({ mutate: vi.fn(), isPending: false }),
  useAdminMarkWithdrawalCompleted: () => ({ mutate: vi.fn(), isPending: false }),
}));

import AdminWithdrawalsPage from "./page";

const item = (name: string): AdminWithdrawalItem => ({
  id: "wd-1", amount: 500000, currency: "VND", status: "pending", rejection_reason: null, transaction_id: null,
  bank_name: "Vietcombank", bank_account_number: "1260866135", bank_account_name: name,
  created_at: "2026-09-27T00:00:00Z", processed_at: null, teacher_id: "t1", teacher_name: "GV A",
  teacher_email: "a@40study.vn", teacher_available_balance: 400000,
});

beforeEach(() => {
  useAuthStore.setState({ sessionStatus: "authenticated", permissions: ["WALLET_WITHDRAWALS_MANAGE"] } as never);
});

describe("/admin/withdrawals — QA8-A12 tên chủ tài khoản trống", () => {
  it("tên trống: chỉ hiện số tài khoản, không có dấu gạch", () => {
    mockItems = [item("")];
    render(<AdminWithdrawalsPage />);
    const line = screen.getByText(/1260866135/);
    expect(line.textContent?.trim()).toBe("1260866135");
  });

  it("tên toàn khoảng trắng cũng coi là trống", () => {
    mockItems = [item("   ")];
    render(<AdminWithdrawalsPage />);
    expect(screen.getByText(/1260866135/).textContent?.trim()).toBe("1260866135");
  });

  it("có tên: vẫn 'số — tên'", () => {
    mockItems = [item("NGUYEN VAN A")];
    render(<AdminWithdrawalsPage />);
    expect(screen.getByText(/1260866135/).textContent?.trim()).toBe("1260866135 — NGUYEN VAN A");
  });
});

describe("/admin/withdrawals — QA8-L1 email giảng viên dài", () => {
  it("email 58 ký tự bị cắt bằng truncate/max-w và còn đủ trong title", () => {
    const long = `${"giang.vien.ten.rat.dai".repeat(2)}@truong-dai-hoc-rat-dai.edu.vn`;
    mockItems = [{ ...item("NGUYEN VAN A"), teacher_name: "GV A", teacher_email: long }];
    render(<AdminWithdrawalsPage />);
    const email = screen.getByTitle(long);
    expect(email.textContent).toBe(long);
    expect(email.className).toMatch(/\btruncate\b/);
    expect(email.className).toMatch(/\bmax-w-\[14rem\]/);
  });
});
