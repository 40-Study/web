/**
 * Hiển thị các khoản tiền về muộn của đơn (L6 mục 3). Backend trả `late_refunds` cho admin: số khoản chờ
 * hoàn, tổng tiền và mã giao dịch từng khoản, để admin biết chính xác cần hoàn bao nhiêu và khoản nào.
 */

import { formatCurrency } from "@/lib/utils";
import type { LateRefundItem, LateRefundSummary } from "@/services/order.service";

function toNumber(value: string | number | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Số tiền của một khoản (chuỗi số của ngân hàng) dạng tiền Việt; không đọc được thì trả nguyên chuỗi. */
export function formatLateRefundAmount(amount: string): string {
  const n = Number(amount);
  return amount.trim() !== "" && Number.isFinite(n) ? formatCurrency(n) : amount || "?";
}

/** Các khoản còn chờ hoàn (chưa được admin ghi nhận). */
export function pendingLateRefunds(summary: LateRefundSummary | null | undefined): LateRefundItem[] {
  return (summary?.items ?? []).filter((item) => !item.refunded);
}

/**
 * Dòng tóm tắt cho danh sách đơn, ví dụ "2 khoản chờ hoàn · 749.000 ₫". null khi không còn khoản nào chờ
 * (đơn chưa từng nhận tiền về muộn, hoặc admin đã hoàn hết).
 */
export function lateRefundSummaryText(summary: LateRefundSummary | null | undefined): string | null {
  if (!summary || summary.pending_count <= 0) return null;
  return `${summary.pending_count} khoản chờ hoàn · ${formatCurrency(toNumber(summary.pending_amount))}`;
}