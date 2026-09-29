/**
 * WithdrawalSection (Phase 4 — rút tiền giảng viên): điều kiện khoá nút rút, dialog số tiền,
 * trạng thái lỗi của lịch sử. Hook dữ liệu được mock (không gọi API thật).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TeacherWalletResponse, WithdrawalItem } from "@/services/wallet.service";

const mockMutate = vi.fn();
const mockCancel = vi.fn();

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
  useCancelWithdrawal: () => ({ mutate: mockCancel, isPending: false }),
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
    mockCancel.mockReset();
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

  // Review Phase 4, W-2: mức tối thiểu phải lấy từ min_withdrawal_amount của API (backend đọc
  // WITHDRAWAL_MIN_AMOUNT), không hardcode 100.000. API trả 200.000: số dư 150.000 phải bị khoá.
  it("mức tối thiểu lấy từ API (200.000đ): số dư 150.000 -> nút rút bị khoá", () => {
    mockWallet = walletFixture({ available_balance: 150000, min_withdrawal_amount: 200000 });
    render(<WithdrawalSection />);
    expect(requestButton().disabled).toBe(true);
    expect(screen.getByText(/chưa đạt mức rút tối thiểu \(200\.000đ\)/i)).toBeTruthy();
  });

  it("mức tối thiểu lấy từ API (200.000đ): nhập 150.000 -> không gọi API", () => {
    mockWallet = walletFixture({ available_balance: 500000, min_withdrawal_amount: 200000 });
    render(<WithdrawalSection />);
    fireEvent.click(requestButton());
    fireEvent.change(screen.getByPlaceholderText("Nhập số tiền muốn rút..."), { target: { value: "150000" } });
    expect(screen.getByText("Số tiền rút tối thiểu là 200.000đ.")).toBeTruthy();
    const confirmBtn = screen.getByRole("button", { name: "Xác nhận rút tiền" }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);
    fireEvent.click(confirmBtn);
    expect(mockMutate).not.toHaveBeenCalled();
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

  // QA vòng 2, Q2: giảng viên tự huỷ yêu cầu còn pending.
  describe("huỷ yêu cầu rút", () => {
    const base = { currency: "VND", rejection_reason: null, transaction_id: null, bank_name: null, bank_account_number: null, bank_account_name: null, created_at: "2026-09-28T01:00:00Z" };

    it("chỉ dòng pending có nút 'Huỷ yêu cầu'; xác nhận gọi API với đúng id", () => {
      mockWallet = walletFixture({ has_open_withdrawal: true });
      mockHistoryItems = [
        { ...base, id: "pending-1", amount: 150000, status: "pending", processed_at: null },
        { ...base, id: "approved-2", amount: 200000, status: "approved", processed_at: "2026-09-28T02:00:00Z" },
      ];
      render(<WithdrawalSection />);
      expect(screen.getAllByRole("button", { name: "Huỷ yêu cầu" })).toHaveLength(1);
      expect(screen.queryByTestId("cancel-withdrawal-approved-2")).toBeNull();

      fireEvent.click(screen.getByTestId("cancel-withdrawal-pending-1"));
      expect(screen.getByText("Huỷ yêu cầu rút tiền?")).toBeTruthy();
      expect(mockCancel).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Xác nhận huỷ" }));
      expect(mockCancel).toHaveBeenCalledTimes(1);
      expect(mockCancel.mock.calls[0][0]).toBe("pending-1");
    });

    it("bấm 'Giữ yêu cầu' thì không gọi API", () => {
      mockWallet = walletFixture({ has_open_withdrawal: true });
      mockHistoryItems = [{ ...base, id: "pending-1", amount: 150000, status: "pending", processed_at: null }];
      render(<WithdrawalSection />);
      fireEvent.click(screen.getByTestId("cancel-withdrawal-pending-1"));
      fireEvent.click(screen.getByRole("button", { name: "Giữ yêu cầu" }));
      expect(mockCancel).not.toHaveBeenCalled();
    });

    it("yêu cầu đã huỷ hiện nhãn 'Đã huỷ', không còn nút huỷ", () => {
      mockWallet = walletFixture({});
      mockHistoryItems = [{ ...base, id: "cancelled-1", amount: 150000, status: "cancelled", processed_at: "2026-09-28T02:00:00Z" }];
      render(<WithdrawalSection />);
      expect(screen.getByText("Đã huỷ")).toBeTruthy();
      expect(screen.getByText("Bạn đã huỷ yêu cầu này")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Huỷ yêu cầu" })).toBeNull();
    });
  });
});