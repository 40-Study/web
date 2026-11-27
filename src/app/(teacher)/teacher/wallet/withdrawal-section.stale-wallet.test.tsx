/**
 * Q10-T-04: refetch nền lỗi (còn ví và lịch sử trong cache): thẻ số dư vẫn hiện 438.200 đ nhưng mục rút tiền khoá nút với
 * "Không tải được thông tin ví" và lịch sử báo "Không tải được lịch sử" cùng lúc với "Trang 1/1 · 3 yêu cầu". Mục này phải theo
 * quy tắc của page.tsx: chỉ báo lỗi khi KHÔNG có dữ liệu cũ.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetchWallet = vi.fn();
const state = vi.hoisted(() => ({
  wallet: undefined as unknown,
  walletError: false,
  history: undefined as unknown,
  historyError: false,
}));

vi.mock("@/hooks/queries/use-wallet", () => ({
  useTeacherWallet: () => ({ data: state.wallet, isLoading: false, isError: state.walletError, refetch: refetchWallet }),
  useMyWithdrawals: () => ({ data: state.history, isLoading: false, isError: state.historyError, refetch: refetchHistory }),
  useCreateWithdrawal: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelWithdrawal: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("./withdrawal-history-table", () => ({ WithdrawalHistoryTable: () => <div data-testid="history-table" /> }));

// eslint-disable-next-line import/first
import { WithdrawalSection } from "./withdrawal-section";

const WALLET = {
  user_id: "t1", total_earnings: 900000, total_paid_out: 0, available_balance: 438200, currency: "VND", order_count: 3,
  bank_name: "Vietcombank", bank_account_number: "0123456789", bank_account_name: "A", pending_withdrawal: 0,
  min_withdrawal_amount: 100000, has_open_withdrawal: false,
};
const HISTORY = { items: [{ id: "w1" }, { id: "w2" }, { id: "w3" }], total_count: 3, page: 1, limit: 10, total_pages: 1 };
const refetchHistory = vi.fn();
const requestButton = () => screen.getByRole("button", { name: /Yêu cầu rút tiền/ }) as HTMLButtonElement;

beforeEach(() => {
  refetchWallet.mockReset();
  refetchHistory.mockReset();
  state.wallet = WALLET;
  state.walletError = false;
  state.history = HISTORY;
  state.historyError = false;
});

describe("WithdrawalSection — Q10-T-04 dữ liệu cũ khi refetch lỗi", () => {
  it("ví lỗi nhưng còn ví cũ: nút rút BẬT, không có 'Không tải được thông tin ví', có dòng báo chưa cập nhật + Thử lại", () => {
    state.walletError = true;
    render(<WithdrawalSection />);

    expect(requestButton().disabled).toBe(false);
    expect(screen.queryByText(/Không tải được thông tin ví/)).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được thông tin ví và lịch sử rút tiền");

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchWallet).toHaveBeenCalledTimes(1);
  });

  it("ví và lịch sử cùng lỗi (còn bản cũ): đúng MỘT thông báo; Thử lại làm mới cả hai (M2)", () => {
    state.walletError = true;
    state.historyError = true;
    render(<WithdrawalSection />);

    expect(screen.getAllByRole("status")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchWallet).toHaveBeenCalledTimes(1);
    expect(refetchHistory).toHaveBeenCalledTimes(1);
  });

  it("trang cha đã báo phần ví (showWalletStaleNotice=false): ví lỗi không báo lần nữa trong mục rút tiền", () => {
    state.walletError = true;
    render(<WithdrawalSection showWalletStaleNotice={false} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(requestButton().disabled).toBe(false);
  });

  it("ví lỗi và KHÔNG có ví cũ: nút khoá với lý do tải ví, không có dòng 'đang hiện số liệu cũ'", () => {
    state.walletError = true;
    state.wallet = undefined;
    render(<WithdrawalSection />);

    expect(requestButton().disabled).toBe(true);
    expect(screen.getByText(/Không tải được thông tin ví/)).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("lịch sử lỗi nhưng còn trang cũ: hiện bảng và phân trang, không báo 'Không tải được lịch sử', có thông báo cũ + Thử lại (M2)", () => {
    state.historyError = true;
    render(<WithdrawalSection />);

    expect(screen.getByRole("status").textContent).toContain("lịch sử rút tiền");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchHistory).toHaveBeenCalledTimes(1);
    expect(refetchWallet).not.toHaveBeenCalled();

    expect(screen.queryByText(/Không tải được lịch sử/)).toBeNull();
    expect(screen.getByTestId("history-table")).toBeTruthy();
    expect(screen.getByText(/Trang 1\/1 · 3 yêu cầu/)).toBeTruthy();
  });

  it("lịch sử lỗi và KHÔNG có trang cũ: vẫn báo lỗi + Thử lại, không rơi vào 'chưa có yêu cầu nào'", () => {
    state.historyError = true;
    state.history = undefined;
    render(<WithdrawalSection />);

    expect(screen.getByText("Không tải được lịch sử yêu cầu rút tiền.")).toBeTruthy();
    expect(screen.queryByText(/chưa có yêu cầu rút tiền nào/)).toBeNull();
  });
});
