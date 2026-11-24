/**
 * Nhãn trạng thái rút tiền + hàm định dạng tiền dùng chung cho ví giảng viên và khu admin.
 *
 * Q6-T06: định dạng tiền chuẩn của cả web là `formatCurrency` (lib/utils.ts, Intl) = "599.000 ₫". Trước đây hàm này
 * có kiểu riêng "599.000đ" (hậu tố dính liền) nên ví và lịch sử rút tiền lệch với thẻ khoá học, voucher, giỏ hàng.
 * Giờ nó chỉ là lớp mỏng ép số về `number` rồi gọi đúng `formatCurrency`, không có định dạng thứ hai.
 */

import type { WithdrawalStatus } from "@/services/wallet.service";
import { formatCurrency } from "./utils";

/**
 * amount có thể là decimal dạng chuỗi JSON ("500000") theo hợp đồng API, hoặc number — luôn
 * Number(x) trước khi định dạng (đúng ghi chú "Web phải Number(x) trước khi format" trong
 * withdrawal-contract.md).
 */
export function formatWithdrawalAmount(amount: string | number): string {
  const n = Number(amount);
  return formatCurrency(Number.isFinite(n) ? n : 0);
}

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt - chờ chuyển khoản",
  rejected: "Bị từ chối",
  completed: "Đã chuyển khoản",
  cancelled: "Đã huỷ",
};

export const WITHDRAWAL_STATUS_VARIANT: Record<
  WithdrawalStatus,
  "success" | "warning" | "destructive" | "default"
> = {
  pending: "warning",
  approved: "default",
  rejected: "destructive",
  completed: "success",
  cancelled: "default",
};

export function getWithdrawalStatusLabel(status: string): string {
  return (WITHDRAWAL_STATUS_LABELS as Record<string, string>)[status] ?? status;
}

export function getWithdrawalStatusVariant(status: string): "success" | "warning" | "destructive" | "default" {
  return (WITHDRAWAL_STATUS_VARIANT as Record<string, "success" | "warning" | "destructive" | "default">)[status] ?? "default";
}
