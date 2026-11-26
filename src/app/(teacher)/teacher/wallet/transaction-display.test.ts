import { describe, expect, it } from "vitest";
import type { TeacherTransaction } from "@/services/wallet.service";
import { visibleWalletTransactions } from "./transaction-display";

const tx = (o: Partial<TeacherTransaction>): TeacherTransaction => ({
  order_id: "o", order_number: "DH1", course_name: "Khoá", course_id: "c", buyer_name: "Lê Văn C",
  amount: 1, currency: "VND", type: "income", status: "completed", created_at: "2026-09-01T00:00:00Z", ...o,
});

describe("visibleWalletTransactions (Q8-T01 + T03)", () => {
  const rows = [tx({ order_number: "A" }), tx({ order_number: "B", status: "cancelled" }), tx({ order_number: "C", buyer_name: "student1" })];

  it("ẩn đơn đã huỷ trừ khi bật, và tìm tên người mua không dấu ('Le' ra 'Lê')", () => {
    expect(visibleWalletTransactions(rows, "", false).map((t) => t.order_number)).toEqual(["A", "C"]);
    expect(visibleWalletTransactions(rows, "", true).map((t) => t.order_number)).toEqual(["A", "B", "C"]);
    expect(visibleWalletTransactions(rows, "le van", false).map((t) => t.order_number)).toEqual(["A"]);
  });
});
