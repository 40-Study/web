/**
 * Định dạng tiền + nhãn trạng thái dùng chung cho luồng rút tiền giảng viên (Phase 4).
 *
 * TÁCH RIÊNG khỏi lib/utils.ts formatCurrency(): formatCurrency dùng Intl style "currency",
 * ra "900.000 ₫" (có khoảng trắng, ký hiệu ₫) — khác định dạng withdrawal-contract.md yêu cầu:
 * "100.000đ" (chấm phân cách nghìn, hậu tố "đ" dính liền, không khoảng trắng). KHÔNG sửa
 * formatCurrency vì nhiều trang khác đang phụ thuộc định dạng cũ của nó.
 */

import type { WithdrawalStatus } from "@/services/wallet.service";

/**
 * amount có thể là decimal dạng chuỗi JSON ("500000") theo hợp đồng API, hoặc number — luôn
 * Number(x) trước khi định dạng (đúng ghi chú "Web phải Number(x) trước khi format" trong
 * withdrawal-contract.md).
 */
export function formatWithdrawalAmount(amount: string | number): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "0đ";
  return `${n.toLocaleString("vi-VN")}đ`;
}

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt - chờ chuyển khoản",
  rejected: "Bị từ chối",
  completed: "Đã chuyển khoản",
};

export const WITHDRAWAL_STATUS_VARIANT: Record<
  WithdrawalStatus,
  "success" | "warning" | "destructive" | "default"
> = {
  pending: "warning",
  approved: "default",
  rejected: "destructive",
  completed: "success",
};

export function getWithdrawalStatusLabel(status: string): string {
  return (WITHDRAWAL_STATUS_LABELS as Record<string, string>)[status] ?? status;
}

export function getWithdrawalStatusVariant(status: string): "success" | "warning" | "destructive" | "default" {
  return (WITHDRAWAL_STATUS_VARIANT as Record<string, "success" | "warning" | "destructive" | "default">)[status] ?? "default";
}
