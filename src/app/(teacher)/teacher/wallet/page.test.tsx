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

vi.mock("@/hooks/queries/use-wallet", () => ({
  useTeacherWallet: () => ({
    data: { available_balance: 0, total_earnings: 0, total_paid_out: 0, order_count: 0 },
    isLoading: false,
  }),
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
