/**
 * A8 (QA 261008): bộ lọc trạng thái / giảng viên / trang phải nằm trên URL để F5, Back và chia sẻ
 * link giữ nguyên bộ lọc. Test ghim các lần gọi router.replace.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import type { AdminWithdrawalItem } from "@/services/wallet.service";

const mockApprove = vi.fn();
const mockReject = vi.fn();
const mockComplete = vi.fn();
const listParams = vi.fn();
const mockReplace = vi.fn();

let mockSearch = "";
let mockItems: AdminWithdrawalItem[] = [];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => "/admin/withdrawals",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

vi.mock("@/hooks/queries/use-wallet", () => ({
  useAdminWithdrawals: (params: unknown) => {
    listParams(params);
    return {
      data: { items: mockItems, total_count: mockItems.length, page: 1, limit: 20, total_pages: 1 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useAdminNegativeBalances: () => ({ data: [], isError: false }),
  useAdminApproveWithdrawal: () => ({ mutate: mockApprove, isPending: false }),
  useAdminRejectWithdrawal: () => ({ mutate: mockReject, isPending: false }),
  useAdminMarkWithdrawalCompleted: () => ({ mutate: mockComplete, isPending: false }),
}));

// eslint-disable-next-line import/first
import AdminWithdrawalsPage from "./page";

function itemFixture(overrides: Partial<AdminWithdrawalItem> = {}): AdminWithdrawalItem {
  return {
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
    teacher_id: "11111111-1111-1111-1111-111111111111",
    teacher_name: "Nguyễn Văn A",
    teacher_email: "teacher-a@40study.vn",
    teacher_available_balance: 400000,
    ...overrides,
  };
}

describe("/admin/withdrawals — A8: bộ lọc đồng bộ URL", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    listParams.mockReset();
    mockItems = [];
    mockSearch = "";
    useAuthStore.setState({
      sessionStatus: "authenticated",
      permissions: ["WALLET_WITHDRAWALS_MANAGE"],
    } as Partial<ReturnType<typeof useAuthStore.getState>>);
  });

  it("bấm tên giảng viên ghi ?teacher=<id> lên URL", () => {
    mockItems = [itemFixture()];
    render(<AdminWithdrawalsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Nguyễn Văn A" }));

    expect(mockReplace).toHaveBeenCalledWith(
      "/admin/withdrawals?teacher=11111111-1111-1111-1111-111111111111",
      { scroll: false }
    );
  });

  it("mở sẵn ?teacher= thì nạp bộ lọc từ URL (F5/chia sẻ link giữ nguyên)", () => {
    mockSearch = "teacher=11111111-1111-1111-1111-111111111111&status=approved";
    mockItems = [itemFixture({ id: "wd-a", status: "approved" })];
    render(<AdminWithdrawalsPage />);

    expect(listParams).toHaveBeenCalledWith(
      expect.objectContaining({
        teacher_id: "11111111-1111-1111-1111-111111111111",
        status: "approved",
      })
    );
    expect(screen.getByRole("button", { name: "Bỏ lọc" })).toBeTruthy();
  });

  it("'Bỏ lọc' xoá teacher khỏi URL", () => {
    mockSearch = "teacher=11111111-1111-1111-1111-111111111111";
    mockItems = [itemFixture()];
    render(<AdminWithdrawalsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Bỏ lọc" }));

    expect(mockReplace).toHaveBeenCalledWith("/admin/withdrawals", { scroll: false });
  });
});
