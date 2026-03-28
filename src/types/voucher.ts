/**
 * Voucher type definitions
 */

import { BaseEntity, ID } from "./common";

export type VoucherStatus = "active" | "used" | "expired";
export type VoucherDiscountType = "percentage" | "fixed";

export interface Voucher extends BaseEntity {
  id: ID;
  code: string;
  discountType: VoucherDiscountType;
  /** Percentage (0-100) or fixed VND amount */
  discountValue: number;
  /** Maximum discount cap for percentage-type vouchers */
  maxDiscount?: number;
  /** Minimum order value required */
  minOrderValue?: number;
  expiresAt: string;
  status: VoucherStatus;
  description?: string;
}

export interface VoucherValidateRequest {
  code: string;
  /** Course price in VND to calculate discount */
  coursePrice: number;
}

export interface VoucherValidateResponse {
  valid: boolean;
  voucher?: Voucher;
  /** Calculated discount amount in VND */
  discountAmount: number;
  finalPrice: number;
  message?: string;
}
