/**
 * Voucher type definitions — snake_case matches backend API responses
 */

import type { ID } from "./common";

export type VoucherStatus = "active" | "inactive" | "expired";
export type VoucherDiscountType = "percentage" | "fixed";

export interface Voucher {
  id: ID;
  code: string;
  discount_type: VoucherDiscountType;
  discount_value: number;
  /** Maximum discount cap for percentage-type vouchers */
  max_discount?: number;
  /** Minimum order value required */
  min_order_value?: number;
  max_uses?: number;
  used_count?: number;
  expires_at?: string;
  status: VoucherStatus;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VoucherValidateRequest {
  code: string;
  course_ids: string[];
}

export interface VoucherValidateResponse {
  valid: boolean;
  voucher?: Voucher;
  /** Calculated discount amount in VND */
  discount_amount: number;
  final_total: number;
  message?: string;
}
