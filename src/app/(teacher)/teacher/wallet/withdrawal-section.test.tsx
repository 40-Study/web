/**
 * WithdrawalSection (Phase 4 — rút tiền giảng viên): điều kiện khoá nút rút, dialog số tiền,
 * trạng thái lỗi của lịch sử. Hook dữ liệu được mock (không gọi API thật).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TeacherWalletResponse, WithdrawalItem } from "@/services/wallet.service";

const mockMutate = vi.fn();

let mockWallet: TeacherWalletResponse;
let mockHistoryItems: WithdrawalItem[] = [];
let mockHistoryError = false;

vi.mock("@/hooks/queries/use-wallet", () => ({
  useTeacherWallet: () => ({ data: mockWallet, isLoading: false, isError: false }),
  useMyWithdrawals: () => ({
    data: mockHistoryError
      ? undefined
      : {
          items: mockHistoryItems,
          total_count: mockHistoryItems.length,
          page: 1,
          limit: 10,
          total_pages: 1,
        },
    isLoading: false,
    isError: mockHistoryError,
    refetch: vi.fn(),
  }),
  useCreateWithdrawal: () => ({ mutate: mockMutate, isPending: false }),
}));

// eslint-disable-next-line import/first
import { WithdrawalSection } from "./withdrawal-section";

function walletFixture(overrides: Partial<TeacherWalletResponse>): TeacherWalletResponse {
  return {
    user_id: "teacher-1",
    total_earnings: 900000,
    total_paid_out: 0,
    available_balance: 400000,
    currency: "VND",
    order_count: 3,
    bank_name: "Vietcombank",
    bank_account_number: "0123456789",
    bank_account_name: "NGUYEN VAN A",
    pending_withdrawal: 0,
    min_withdrawal_amount: 100000,
    has_open_withdrawal: false,
    ...overrides,
  };
}

function requestButton() {
  return screen.getByRole("button", { name: /Yêu cầu rút tiền/i }) as HTMLButtonElement;
}

describe("WithdrawalSection", () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockHistoryItems = [];
    mockHistoryError = false;
  });

  it("chưa có bank info -> nút rút bị khoá kèm hướng dẫn", () => {
    mockWallet = walletFixture({ bank_name: undefined, bank_account_number: undefined, bank_account_name: undefined });
    render(<WithdrawalSection />);
    expect(requestButton().disabled).toBe(true);
    expect(screen.getByText(/thêm thông tin tài khoản ngân hàng/i)).toBeTruthy();
  });

  it("đang có yêu cầu mở -> nút rút bị khoá dù đủ bank info và số dư", () => {
    mockWallet = walletFixture({ has_open_withdrawal: true });
    render(<WithdrawalSection />);
    expect(requestButton().disabled).toBe(true);
    expect(screen.getByText(/chưa xử lý xong/i)).toBeTruthy();
  });

  it("số dư âm -> cảnh báo đỏ và nút rút bị khoá", () => {
    mockWallet = walletFixture({ available_balance: -200000 });
    render(<WithdrawalSection />);
    expect(screen.getByText("-200.000đ")).toBeTruthy();
    expect(screen.getByText(/bị chặn tới khi doanh thu mới bù lại/i)).toBeTruthy();
    expect(requestButton().disabled).toBe(true);
  });

  it("số dư dương nhưng dưới mức tối thiểu -> nút rút bị khoá", () => {
    mockWallet = walletFixture({ available_balance: 99999 });
    render(<WithdrawalSection />);
    expect(requestButton().disabled).toBe(true);
    expect(screen.getByText(/chưa đạt mức rút tối thiểu \(100\.000đ\)/i)).toBeTruthy();
  });

  it("đủ điều kiện -> nút rút bật", () => {
    mockWallet = walletFixture({});
    render(<WithdrawalSection />);
    expect(requestButton().disabled).toBe(false);
  });

  it("dialog hiện 'Số dư còn lại sau khi rút' = số dư − số tiền nhập", () => {
    mockWallet = walletFixture({ available_balance: 500000 });
    render(<WithdrawalSection />);
    fireEvent.click(requestButton());
    fireEvent.change(screen.getByPlaceholderText("Nhập số tiền muốn rút..."), { target: { value: "200000" } });
    expect(screen.getByText("300.000đ")).toBeTruthy();
  });

  it("nhập dưới mức tối thiểu -> không gọi API", () => {
    mockWallet = walletFixture({ available_balance: 500000 });
    render(<WithdrawalSection />);
    fireEvent.click(requestButton());
    fireEvent.change(screen.getByPlaceholderText("Nhập số tiền muốn rút..."), { target: { value: "50000" } });
    const confirmBtn = screen.getByRole("button", { name: "Xác nhận rút tiền" }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);
    fireEvent.click(confirmBtn);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("nhập vượt số dư -> không gọi API", () => {
    mockWallet = walletFixture({ available_balance: 500000 });
    render(<WithdrawalSection />);
    fireEvent.click(requestButton());
    fireEvent.change(screen.getByPlaceholderText("Nhập số tiền muốn rút..."), { target: { value: "600000" } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận rút tiền" }));
    expect(mockMutate).not.toHaveBeenCalled();
    expect(screen.getByText(/vượt quá số dư khả dụng/i)).toBeTruthy();
  });

  it("nhập hợp lệ -> gọi API với đúng số tiền", () => {
    mockWallet = walletFixture({ available_balance: 500000 });
    render(<WithdrawalSection />);
    fireEvent.click(requestButton());
    fireEvent.change(screen.getByPlaceholderText("Nhập số tiền muốn rút..."), { target: { value: "200000" } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận rút tiền" }));
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0][0]).toBe(200000);
  });

  it("lịch sử có lý do từ chối và mã giao dịch", () => {
    mockWallet = walletFixture({});
    mockHistoryItems = [
      { id: "aaaaaaaa-1", amount: 150000, currency: "VND", status: "rejected", rejection_reason: "Sai tên chủ TK", transaction_id: null, bank_name: null, bank_account_number: null, bank_account_name: null, created_at: "2026-09-28T01:00:00Z", processed_at: "2026-09-28T02:00:00Z" },
      { id: "bbbbbbbb-2", amount: 200000, currency: "VND", status: "completed", rejection_reason: null, transaction_id: "FT123", bank_name: null, bank_account_number: null, bank_account_name: null, created_at: "2026-09-28T01:00:00Z", processed_at: "2026-09-28T03:00:00Z" },
    ];
    render(<WithdrawalSection />);
    expect(screen.getByText("Lý do từ chối: Sai tên chủ TK")).toBeTruthy();
    expect(screen.getByText("Mã GD: FT123")).toBeTruthy();
    expect(screen.getByText("Bị từ chối")).toBeTruthy();
    expect(screen.getByText("Đã chuyển khoản")).toBeTruthy();
  });

  it("lỗi tải lịch sử -> hiện lỗi, KHÔNG hiện 'chưa có yêu cầu nào'", () => {
    mockWallet = walletFixture({});
    mockHistoryError = true;
    render(<WithdrawalSection />);
    expect(screen.getByText(/Không tải được lịch sử/i)).toBeTruthy();
    expect(screen.queryByText(/chưa có yêu cầu rút tiền nào/i)).toBeNull();
  });
});
