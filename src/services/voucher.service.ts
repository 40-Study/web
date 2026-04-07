/**
 * Voucher service — public, user, and admin voucher management
 * Endpoints: /vouchers
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type VoucherDiscountType = "percentage" | "fixed";

export interface Voucher {
  id: string;
  code: string;
  description?: string;
  discount_type: VoucherDiscountType;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_per_user?: number;
  used_count?: number;
  start_date?: string;
  end_date?: string;
  applicable_course_ids?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVoucherDTO {
  code: string;
  description?: string;
  discount_type: VoucherDiscountType;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_per_user?: number;
  start_date?: string;
  end_date?: string;
  applicable_course_ids?: string[];
  is_active?: boolean;
}

export interface UpdateVoucherDTO {
  description?: string;
  discount_value?: number;
  usage_limit?: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_per_user?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const voucherService = {
  // ── Public ────────────────────────────────────────────────────────────────

  /** GET /vouchers/public */
  getPublicVouchers: () =>
    api.get<R<Voucher[]>>("/vouchers/public").then((r) => r.data.data),

  /** GET /vouchers/code/:code */
  getVoucherByCode: (code: string) =>
    api.get<R<Voucher>>(`/vouchers/code/${code}`).then((r) => r.data.data),

  // ── User ──────────────────────────────────────────────────────────────────

  /** GET /vouchers/me — saved vouchers */
  getMyVouchers: () =>
    api.get<R<Voucher[]>>("/vouchers/me").then((r) => r.data.data),

  /** POST /vouchers/:id/save */
  saveVoucher: (id: string) =>
    api.post<R<null>>(`/vouchers/${id}/save`, {}).then((r) => r.data),

  /** DELETE /vouchers/:id/save */
  unsaveVoucher: (id: string) =>
    api.delete<R<null>>(`/vouchers/${id}/save`).then((r) => r.data),

  // ── Admin ─────────────────────────────────────────────────────────────────

  /** POST /vouchers */
  createVoucher: (dto: CreateVoucherDTO) =>
    api.post<R<Voucher>>("/vouchers", dto).then((r) => r.data.data),

  /** GET /vouchers?page=&limit= */
  getAllVouchers: (params?: { page?: number; limit?: number }) =>
    api.get<R<Voucher[]>>("/vouchers", { params }).then((r) => r.data.data),

  /** GET /vouchers/:id */
  getVoucherById: (id: string) =>
    api.get<R<Voucher>>(`/vouchers/${id}`).then((r) => r.data.data),

  /** PUT /vouchers/:id */
  updateVoucher: (id: string, dto: UpdateVoucherDTO) =>
    api.put<R<Voucher>>(`/vouchers/${id}`, dto).then((r) => r.data.data),

  /** DELETE /vouchers/:id */
  deleteVoucher: (id: string) =>
    api.delete<R<null>>(`/vouchers/${id}`).then((r) => r.data),

  /** POST /vouchers/:id/restore */
  restoreVoucher: (id: string) =>
    api.post<R<null>>(`/vouchers/${id}/restore`, {}).then((r) => r.data),

  /** POST /vouchers/:id/activate */
  activateVoucher: (id: string) =>
    api.post<R<null>>(`/vouchers/${id}/activate`, {}).then((r) => r.data),

  /** POST /vouchers/:id/deactivate */
  deactivateVoucher: (id: string) =>
    api.post<R<null>>(`/vouchers/${id}/deactivate`, {}).then((r) => r.data),

  /** GET /vouchers/:id/stats */
  getVoucherStats: (id: string) =>
    api.get<R<{ total_uses: number; total_discount: number }>>(`/vouchers/${id}/stats`).then((r) => r.data.data),
};
