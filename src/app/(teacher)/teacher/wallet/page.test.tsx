/**
 * Review đối kháng web PR #27 (MAJOR): trang ví giáo viên không có test tự động — bug gốc P2
 * QA 260927 teacher là đơn "Đã huỷ" hiện "+499.000 ₫" MÀU XANH y hệt thu nhập thật (trước đây
 * dấu +/màu chỉ theo `tx.type`, bỏ qua hẳn `tx.status`), dễ khiến giáo viên tưởng đã nhận được
 * tiền cho một đơn đã huỷ. Test dưới đây khoá lại: đơn "cancelled" phải hiện trung tính, KHÔNG
 * dấu "+", KHÔNG màu xanh — nếu ai đó sau này refactor lại logic amountClassName/amountSign mà
 * quên nhánh status, suite hiện tại (không test file nào chạm wallet/page.tsx) vẫn xanh 100%.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TeacherTransaction } from "@/services/wallet.service";

let mockTransactions: TeacherTransaction[] = [];
const emptyWallet = {
  available_balance: 0,
  total_earnings: 0,
  total_paid_out: 0,
  pending_withdrawal: 0,
  order_count: 0,
};
let mockWallet = emptyWallet;

vi.mock("@/hooks/queries/use-wallet", () => ({
  useTeacherWallet: () => ({ data: mockWallet, isLoading: false }),
  useTeacherTransactions: () => ({
    data: {
      transactions: mockTransactions,
      total_count: mockTransactions.length,
      page: 1,
      limit: 20,
      total_pages: 1,
    },
    isLoading: false,
  }),
}));

vi.mock("./bank-info-dialog", () => ({
  BankInfoDialog: () => null,
}));

// Phase 4 (rút tiền): khối riêng, có test riêng ở withdrawal-section.test.tsx — mock no-op ở đây
// để suite review-đối-kháng PR #27 (bảng giao dịch) không phụ thuộc thêm hook rút tiền.
vi.mock("./withdrawal-section", () => ({
  WithdrawalSection: () => null,
}));

// eslint-disable-next-line import/first
import TeacherWalletPage from "./page";

function txFixture(overrides: Partial<TeacherTransaction>): TeacherTransaction {
  return {
    order_id: "order-1",
    order_number: "DH001",
    course_name: "Khóa test",
    course_id: "course-1",
    buyer_name: "Học viên A",
    amount: 499000,
    currency: "VND",
    type: "income",
    status: "completed",
    created_at: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

/** Đọc số tiền VND ngay sau nhãn trong dòng tóm tắt, vd "Đang chờ rút: 100.000 ₫" -> 100000. */
function amountAfter(text: string, label: string): number {
  const m = text.match(new RegExp(`${label}:\\s*(-?[\\d.]+)`));
  if (!m) throw new Error(`không thấy "${label}" trong: ${text}`);
  return Number(m[1].replace(/\./g, ""));
}

describe("/teacher/wallet — các con số số dư cộng lại được (review Phase 4, W-1)", () => {
  it("Tổng thu nhập = Đã rút + Đang chờ rút + Khả dụng, cả 4 số đều hiện trên trang", () => {
    mockTransactions = [];
    mockWallet = {
      available_balance: 885000,
      total_earnings: 1185000,
      total_paid_out: 200000,
      pending_withdrawal: 100000,
      order_count: 2,
    };
    render(<TeacherWalletPage />);

    const breakdown = screen.getByTestId("wallet-breakdown").textContent ?? "";
    const total = amountAfter(breakdown, "Tổng thu nhập");
    const paid = amountAfter(breakdown, "Đã rút");
    const pending = amountAfter(breakdown, "Đang chờ rút");
    const available = Number((screen.getByText(/^885\.000/).textContent ?? "").replace(/\D/g, ""));

    expect([total, paid, pending, available]).toEqual([1185000, 200000, 100000, 885000]);
    expect(paid + pending + available).toBe(total);
    mockWallet = emptyWallet;
  });
});

describe("/teacher/wallet — đơn huỷ không hiện như đã nhận tiền (review đối kháng PR #27)", () => {
  it("đơn 'cancelled': KHÔNG dấu '+', KHÔNG màu xanh (text-green-600), badge 'Đã huỷ'", () => {
    mockTransactions = [txFixture({ order_id: "cancelled-1", status: "cancelled", type: "income" })];
    render(<TeacherWalletPage />);

    expect(screen.getByText("Đã huỷ")).toBeTruthy();
    const amountCell = screen.getByText(/499\.000/);
    expect(amountCell.textContent).not.toContain("+");
    expect(amountCell.className).not.toContain("text-green-600");
  });

  it("đơn 'completed' (income): CÓ dấu '+' và màu xanh — đối chứng, không phải mọi đơn đều trung tính", () => {
    mockTransactions = [txFixture({ order_id: "completed-1", status: "completed", type: "income" })];
    render(<TeacherWalletPage />);

    const amountCell = screen.getByText(/\+.*499\.000/);
    expect(amountCell.className).toContain("text-green-600");
  });

  it("đơn hoàn tiền (type=expense): dấu '-' và màu đỏ, bất kể status", () => {
    mockTransactions = [txFixture({ order_id: "refund-1", status: "completed", type: "expense" })];
    render(<TeacherWalletPage />);

    const amountCell = screen.getByText(/-.*499\.000/);
    expect(amountCell.className).toContain("text-red-500");
  });
});
