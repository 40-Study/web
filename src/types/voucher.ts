/**
 * Voucher type definitions — SSOT là internal/model/payment.go#Voucher,
 * mirror trong src/services/voucher.service.ts. File này chỉ giữ các type
 * UI-only (kết quả áp dụng voucher tại chỗ) để tránh trùng lặp định nghĩa.
 */

export type { Voucher, VoucherDiscountUnit, VoucherDiscountMethod } from "@/services/voucher.service";
import type { Voucher } from "@/services/voucher.service";

export interface VoucherValidateRequest {
  code: string;
  course_ids: string[];
}

export interface VoucherValidateResponse {
  valid: boolean;
  voucher?: Pick<Voucher, "id" | "code">;
  /** Số tiền được giảm (VND), tính tại client từ dữ liệu voucher công khai */
  discount_amount: number;
  message?: string;
}
