/** Q4-T18: ở 390px mỗi giao dịch là một thẻ có giá bán và trạng thái, không bị đẩy vào thanh cuộn ngang. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TeacherTransaction } from "@/services/wallet.service";
import { TransactionCardList } from "./transaction-card-list";

const tx = (over: Partial<TeacherTransaction>): TeacherTransaction => ({
  order_id: "o1",
  order_number: "DH001",
  course_name: "Khoá test",
  course_id: "c1",
  buyer_name: "Học viên A",
  amount: 499000,
  currency: "VND",
  type: "income",
  status: "completed",
  created_at: "2026-09-01T00:00:00Z",
  ...over,
});

describe("TransactionCardList", () => {
  it("hiện mã, khoá, người mua, giá bán và trạng thái", () => {
    render(<TransactionCardList transactions={[tx({})]} />);
    expect(screen.getByText("Khoá test")).toBeTruthy();
    expect(screen.getByText(/DH001/)).toBeTruthy();
    expect(screen.getByText("Người mua: Học viên A")).toBeTruthy();
    expect(screen.getByText("Hoàn thành")).toBeTruthy();
    const amount = screen.getByText(/499\.000/);
    expect(amount.textContent).toContain("+");
    expect(amount.className).toContain("text-green-700");
  });

  it("đơn huỷ: không dấu '+' và không màu xanh (cùng luật với bảng)", () => {
    render(<TransactionCardList transactions={[tx({ status: "cancelled" })]} />);
    const amount = screen.getByText(/499\.000/);
    expect(amount.textContent).not.toContain("+");
    expect(amount.className).not.toContain("text-green-700");
  });

  it("không có giao dịch: báo rỗng", () => {
    render(<TransactionCardList transactions={[]} />);
    expect(screen.getByText("Không có giao dịch nào.")).toBeTruthy();
  });
});
