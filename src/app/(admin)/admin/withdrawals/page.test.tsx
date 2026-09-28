/**
 * /admin/withdrawals (Phase 4 — rút tiền giảng viên): nút theo trạng thái, dialog bắt buộc nhập
 * lý do / mã giao dịch, cảnh báo số dư âm, lọc theo giảng viên. Hook dữ liệu được mock.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import type { AdminWithdrawalItem, NegativeBalanceItem } from "@/services/wallet.service";

const mockApprove = vi.fn();
const mockReject = vi.fn();
const mockComplete = vi.fn();
const listParams = vi.fn();

let mockItems: AdminWithdrawalItem[] = [];
let mockNegative: NegativeBalanceItem[] = [];

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
  useAdminNegativeBalances: () => ({ data: mockNegative, isError: false }),
  useAdminApproveWithdrawal: () => ({ mutate: mockApprove, isPending: false }),
  useAdminRejectWithdrawal: () => ({ mutate: mockReject, isPending: false }),
  useAdminMarkWithdrawalCompleted: () => ({ mutate: mockComplete, isPending: false }),
}));

// eslint-disable-next-line import/first
import AdminWithdrawalsPage from "./page";

function itemFixture(overrides: Partial<AdminWithdrawalItem>): AdminWithdrawalItem {
  return {
    id: "wd-11111111-2222",
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
    teacher_id: "teacher-1",
    teacher_name: "Nguyễn Văn A",
    teacher_email: "teacher-a@40study.vn",
    teacher_available_balance: 400000,
    ...overrides,
  };
}

describe("AdminWithdrawalsPage", () => {
  beforeEach(() => {
    mockApprove.mockReset();
    mockReject.mockReset();
    mockComplete.mockReset();
    listParams.mockReset();
    mockNegative = [];
    useAuthStore.setState({
      sessionStatus: "authenticated",
      permissions: ["WALLET_WITHDRAWALS_MANAGE"],
    } as Partial<ReturnType<typeof useAuthStore.getState>>);
  });

  it("yêu cầu 'pending' hiện nút Duyệt + Từ chối", () => {
    mockItems = [itemFixture({ id: "wd-pending", status: "pending" })];
    render(<AdminWithdrawalsPage />);

    expect(screen.getByRole("button", { name: "Duyệt" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Từ chối" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Đánh dấu đã chuyển" })).toBeNull();
  });

  it("yêu cầu 'approved' hiện nút Đánh dấu đã chuyển, KHÔNG có Duyệt/Từ chối", () => {
    mockItems = [itemFixture({ id: "wd-approved", status: "approved" })];
    render(<AdminWithdrawalsPage />);

    expect(screen.getByRole("button", { name: "Đánh dấu đã chuyển" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Duyệt" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Từ chối" })).toBeNull();
  });

  it("từ chối không nhập lý do -> nút xác nhận disable, KHÔNG gọi mutate", () => {
    mockItems = [itemFixture({ id: "wd-pending", status: "pending" })];
    render(<AdminWithdrawalsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Từ chối" }));
    const confirmBtn = screen.getByRole("button", { name: "Xác nhận từ chối" }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);

    fireEvent.click(confirmBtn);
    expect(mockReject).not.toHaveBeenCalled();
  });

  it("từ chối có nhập lý do -> gọi mutate với đúng {id, reason}", () => {
    mockItems = [itemFixture({ id: "wd-pending", status: "pending" })];
    render(<AdminWithdrawalsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Từ chối" }));
    fireEvent.change(screen.getByPlaceholderText(/Thông tin ngân hàng không khớp/i), {
      target: { value: "Sai thông tin ngân hàng" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận từ chối" }));

    expect(mockReject).toHaveBeenCalledTimes(1);
    const [payload] = mockReject.mock.calls[0] as [{ id: string; reason: string }];
    expect(payload.id).toBe("wd-pending");
    expect(payload.reason).toBe("Sai thông tin ngân hàng");
  });

  it("đánh dấu đã chuyển không nhập mã GD -> nút xác nhận disable, KHÔNG gọi mutate", () => {
    mockItems = [itemFixture({ id: "wd-approved", status: "approved" })];
    render(<AdminWithdrawalsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu đã chuyển" }));
    const confirmBtn = screen.getByRole("button", { name: "Xác nhận đã chuyển" }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);

    fireEvent.click(confirmBtn);
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it("đánh dấu đã chuyển có mã GD -> gọi mutate với {id, transactionId}", () => {
    mockItems = [itemFixture({ id: "wd-approved", status: "approved" })];
    render(<AdminWithdrawalsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu đã chuyển" }));
    fireEvent.change(screen.getByPlaceholderText("VD: FT2609271234"), { target: { value: " FT999 " } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đã chuyển" }));
    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(mockComplete.mock.calls[0][0]).toEqual({ id: "wd-approved", transactionId: "FT999" });
  });

  it("duyệt -> gọi mutate với id", () => {
    mockItems = [itemFixture({ id: "wd-pending", status: "pending" })];
    render(<AdminWithdrawalsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Duyệt" }));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận duyệt" }));
    expect(mockApprove.mock.calls[0][0]).toBe("wd-pending");
  });

  it("giảng viên số dư âm -> banner cảnh báo + cảnh báo trong dialog duyệt", () => {
    mockNegative = [{ teacher_id: "teacher-1", teacher_name: "Nguyễn Văn A", teacher_email: "teacher-a@40study.vn", available_balance: -150000 }];
    mockItems = [itemFixture({ id: "wd-pending", status: "pending", teacher_available_balance: -150000 })];
    render(<AdminWithdrawalsPage />);
    expect(screen.getByText(/1 giảng viên đang có số dư âm/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Duyệt" }));
    expect(screen.getByText(/Cân nhắc từ chối/i)).toBeTruthy();
  });

  it("số dư dương -> dialog duyệt KHÔNG có cảnh báo âm", () => {
    mockItems = [itemFixture({ id: "wd-pending", status: "pending", teacher_available_balance: 400000 })];
    render(<AdminWithdrawalsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Duyệt" }));
    expect(screen.queryByText(/Cân nhắc từ chối/i)).toBeNull();
  });

  it("bấm tên giảng viên -> lọc theo teacher_id đó, 'Bỏ lọc' xoá bộ lọc", () => {
    mockItems = [itemFixture({ id: "wd-pending", teacher_id: "teacher-xyz" })];
    render(<AdminWithdrawalsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Nguyễn Văn A" }));
    expect(listParams).toHaveBeenLastCalledWith(expect.objectContaining({ teacher_id: "teacher-xyz" }));
    fireEvent.click(screen.getByRole("button", { name: "Bỏ lọc" }));
    expect(listParams).toHaveBeenLastCalledWith(expect.objectContaining({ teacher_id: undefined }));
  });

  it("không có quyền WALLET_WITHDRAWALS_MANAGE -> không thấy nút hành động nào", () => {
    useAuthStore.setState({ sessionStatus: "authenticated", permissions: [] } as Partial<
      ReturnType<typeof useAuthStore.getState>
    >);
    mockItems = [itemFixture({ id: "wd-pending", status: "pending" })];
    render(<AdminWithdrawalsPage />);

    expect(screen.queryByRole("button", { name: "Duyệt" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Từ chối" })).toBeNull();
  });
});
