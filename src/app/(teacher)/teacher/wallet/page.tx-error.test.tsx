/**
 * Q10-T-02: chỉ GET /wallet/teacher/transactions lỗi (ví vẫn tải được) => bảng hiện "Không có giao dịch nào." và
 * "Trang 1/1 · 0 giao dịch" như dữ liệu thật; giảng viên có đơn đã thanh toán tưởng chưa có giao dịch.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetchTx = vi.fn();
let txState: { data: unknown; isLoading: boolean; isError: boolean; error?: unknown };

vi.mock("./transaction-card-list", () => ({ TransactionCardList: () => null }));
vi.mock("./bank-info-dialog", () => ({ BankInfoDialog: () => null }));
vi.mock("./withdrawal-section", () => ({ WithdrawalSection: () => null }));
vi.mock("@/hooks/queries/use-wallet", () => ({
  useTeacherWallet: () => ({
    data: { available_balance: 438200, total_earnings: 500000, total_paid_out: 0, pending_withdrawal: 0, order_count: 3 },
    isLoading: false,
    isError: false,
  }),
  useTeacherTransactions: () => ({ ...txState, refetch: refetchTx }),
}));

// eslint-disable-next-line import/first
import TeacherWalletPage from "./page";

const TX_OK = { transactions: [], total_count: 0, page: 1, limit: 20, total_pages: 1 };

beforeEach(() => refetchTx.mockReset());

describe("/teacher/wallet — bảng giao dịch lỗi (Q10-T-02)", () => {
  it("lỗi: hộp lỗi + Thử lại; không 'Không có giao dịch nào', không '0 giao dịch'; Xuất CSV khoá; số dư vẫn hiện", () => {
    txState = { data: undefined, isLoading: false, isError: true, error: new Error("boom") };
    render(<TeacherWalletPage />);

    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText("Không có giao dịch nào.")).toBeNull();
    expect(screen.queryByText(/0 giao dịch/)).toBeNull();
    expect((screen.getByRole("button", { name: /Xuất CSV/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Số dư khả dụng")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchTx).toHaveBeenCalledTimes(1);
  });

  it("đối chứng: tải được nhưng rỗng thì vẫn là 'Không có giao dịch nào.' và phân trang", () => {
    txState = { data: TX_OK, isLoading: false, isError: false };
    render(<TeacherWalletPage />);
    expect(screen.getByText("Không có giao dịch nào.")).toBeTruthy();
    expect(screen.getByText(/Trang 1\/1 · 0 giao dịch/)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect((screen.getByRole("button", { name: /Xuất CSV/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("refetch nền lỗi nhưng còn dữ liệu cũ: giữ bảng, không phủ hộp lỗi", () => {
    txState = { data: TX_OK, isLoading: false, isError: true, error: new Error("net") };
    render(<TeacherWalletPage />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Không có giao dịch nào.")).toBeTruthy();
  });
});
