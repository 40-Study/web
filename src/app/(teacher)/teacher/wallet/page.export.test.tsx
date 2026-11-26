/**
 * Q8-T03: "Xuất CSV" phải khớp bảng đang xem. Trước đây file xuất mọi dòng của tab, kể cả đơn đã huỷ (bảng đang ẩn)
 * và bỏ qua ô tìm kiếm, nên cộng cột "Số tiền" ra thừa 499.000. Dữ liệu đi qua walletService thật (mock ở mức service).
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TeacherTransaction } from "@/services/wallet.service";

const downloadCsv = vi.fn();
const getTeacherTransactions = vi.fn();

vi.mock("@/lib/csv-export", async (orig) => ({
  ...(await orig<typeof import("@/lib/csv-export")>()),
  downloadCsv: (name: string, csv: string) => downloadCsv(name, csv),
}));
vi.mock("@/services/wallet.service", () => ({
  walletService: { getTeacherTransactions: (...args: unknown[]) => getTeacherTransactions(...args) },
}));
vi.mock("./transaction-card-list", () => ({ TransactionCardList: () => null }));
vi.mock("./bank-info-dialog", () => ({ BankInfoDialog: () => null }));
vi.mock("./withdrawal-section", () => ({ WithdrawalSection: () => null }));
vi.mock("@/hooks/queries/use-wallet", () => ({
  useTeacherWallet: () => ({ data: undefined, isLoading: false }),
  useTeacherTransactions: () => ({ data: { transactions: [], total_count: 0, page: 1, limit: 20, total_pages: 1 }, isLoading: false }),
}));

// eslint-disable-next-line import/first
import TeacherWalletPage from "./page";

function tx(overrides: Partial<TeacherTransaction>): TeacherTransaction {
  return {
    order_id: "o",
    order_number: "DH-OK",
    course_name: "Python cho Người mới",
    course_id: "c",
    buyer_name: "Lê Văn C",
    amount: 100000,
    currency: "VND",
    type: "income",
    status: "completed",
    created_at: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

const ALL = [
  tx({ order_id: "1", order_number: "DH-OK" }),
  tx({ order_id: "2", order_number: "DH-HUY", status: "cancelled", amount: 499000 }),
  tx({ order_id: "3", order_number: "DH-KHAC", course_name: "Git cơ bản", buyer_name: "Trần Thị D" }),
];

async function exportedCsv(): Promise<string> {
  fireEvent.click(screen.getByRole("button", { name: /Xuất CSV/ }));
  await waitFor(() => expect(downloadCsv).toHaveBeenCalledTimes(1));
  return downloadCsv.mock.calls[0][1] as string;
}

describe("/teacher/wallet — Xuất CSV khớp bảng (Q8-T03)", () => {
  beforeEach(() => {
    downloadCsv.mockClear();
    getTeacherTransactions.mockReset();
    getTeacherTransactions.mockResolvedValue({ transactions: ALL, total_count: 3, page: 1, limit: 100, total_pages: 1 });
  });

  it("mặc định không có đơn đã huỷ trong file", async () => {
    render(<TeacherWalletPage />);
    const csv = await exportedCsv();
    expect(csv).toContain("DH-OK");
    expect(csv).toContain("DH-KHAC");
    expect(csv).not.toContain("DH-HUY");
  });

  it("bật 'Hiện đơn đã huỷ' thì file có đơn đã huỷ", async () => {
    render(<TeacherWalletPage />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(await exportedCsv()).toContain("DH-HUY");
  });

  it("áp dụng ô tìm kiếm (không dấu): 'nguoi moi' chỉ còn đơn khoá Python", async () => {
    render(<TeacherWalletPage />);
    fireEvent.change(screen.getByLabelText(/Tìm theo mã giao dịch/), { target: { value: "nguoi moi" } });
    const csv = await exportedCsv();
    expect(csv).toContain("DH-OK");
    expect(csv).not.toContain("DH-KHAC");
  });
});
