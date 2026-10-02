import { describe, expect, it } from "vitest";
import type { LateRefundItem, LateRefundSummary } from "@/services/order.service";
import { formatLateRefundAmount, lateRefundSummaryText, pendingLateRefunds } from "./late-refund";

const item = (over: Partial<LateRefundItem>): LateRefundItem => ({
  ref: "TX",
  transaction_id: "TX",
  amount: "100000",
  flagged_at: "2026-10-02T01:00:00Z",
  refunded: false,
  ...over,
});

describe("late-refund", () => {
  it("tóm tắt: số khoản chờ và tổng tiền", () => {
    const summary: LateRefundSummary = { pending_count: 2, pending_amount: "749000", items: [] };
    const text = lateRefundSummaryText(summary) ?? "";
    expect(text).toContain("2 khoản chờ hoàn");
    expect(text.replace(/\s/g, " ")).toMatch(/749\.000/);
  });

  it("không còn khoản chờ hoặc không có dữ liệu thì không có dòng tóm tắt", () => {
    expect(lateRefundSummaryText(null)).toBeNull();
    expect(lateRefundSummaryText(undefined)).toBeNull();
    expect(lateRefundSummaryText({ pending_count: 0, pending_amount: "0", items: [item({ refunded: true })] })).toBeNull();
  });

  it("chỉ lấy các khoản chưa hoàn", () => {
    const summary: LateRefundSummary = {
      pending_count: 1,
      pending_amount: "250000",
      items: [item({ ref: "A", refunded: true }), item({ ref: "B", amount: "250000" })],
    };
    expect(pendingLateRefunds(summary).map((i) => i.ref)).toEqual(["B"]);
    expect(pendingLateRefunds(null)).toEqual([]);
  });

  it("số tiền không đọc được giữ nguyên chuỗi, rỗng thì báo ?", () => {
    expect(formatLateRefundAmount("abc")).toBe("abc");
    expect(formatLateRefundAmount("")).toBe("?");
    expect(formatLateRefundAmount("499000").replace(/\s/g, " ")).toMatch(/499\.000/);
  });
});