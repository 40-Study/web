/**
 * Q9-T-01: GET /wallet/teacher/me lỗi -> trang hiện "0 ₫", "Số đơn hàng 0" và "Chưa có tài khoản ngân hàng ... Thêm TK"
 * như dữ liệu thật (giảng viên có thể nhập đè tài khoản đã lưu). Phải hiện một hộp lỗi có "Thử lại".
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetchWallet = vi.fn();
let walletState: { data: unknown; isLoading: boolean; isError: boolean; error?: unknown };

vi.mock("./transaction-card-list", () => ({ TransactionCardList: () => null }));
vi.mock("./bank-info-dialog", () => ({ BankInfoDialog: () => null }));
vi.mock("./withdrawal-section", () => ({ WithdrawalSection: () => null }));
vi.mock("@/hooks/queries/use-wallet", () => ({
  useTeacherWallet: () => ({ ...walletState, refetch: refetchWallet }),
  useTeacherTransactions: () => ({
    data: { transactions: [], total_count: 0, page: 1, limit: 20, total_pages: 1 },
    isLoading: false,
  }),
}));

// eslint-disable-next-line import/first
import TeacherWalletPage from "./page";

beforeEach(() => refetchWallet.mockReset());

describe("/teacher/wallet — ví không tải được (Q9-T-01)", () => {
  it("hiện hộp lỗi + Thử lại, không hiện số dư 0 ₫ hay 'Thêm TK'", () => {
    walletState = { data: undefined, isLoading: false, isError: true, error: new Error("boom") };
    render(<TeacherWalletPage />);

    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText("Số dư khả dụng")).toBeNull();
    expect(screen.queryByText("Số đơn hàng")).toBeNull();
    expect(screen.queryByText(/Chưa có tài khoản ngân hàng/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Thêm TK" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchWallet).toHaveBeenCalledTimes(1);
  });

  it("đối chứng: ví tải được thì vẫn hiện thẻ số dư và tài khoản", () => {
    walletState = {
      data: { available_balance: 438200, total_earnings: 500000, total_paid_out: 0, pending_withdrawal: 0, order_count: 3, bank_name: "Vietcombank", bank_account_number: "0123456789", bank_account_name: "A" },
      isLoading: false,
      isError: false,
    };
    render(<TeacherWalletPage />);
    expect(screen.getByText("Số dư khả dụng")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Thay đổi" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("refetch lỗi nhưng còn dữ liệu cũ: giữ số liệu, không phủ hộp lỗi", () => {
    walletState = {
      data: { available_balance: 438200, total_earnings: 500000, total_paid_out: 0, pending_withdrawal: 0, order_count: 3 },
      isLoading: false,
      isError: true,
    };
    render(<TeacherWalletPage />);
    expect(screen.getByText("Số dư khả dụng")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
