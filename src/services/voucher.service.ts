/**
 * Voucher service — real API calls for voucher management
 */

import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type VoucherStatus = "active" | "inactive" | "expired";
export type VoucherDiscountType = "percentage" | "fixed";

export interface Voucher {
  id: string;
  code: string;
  discount_type: VoucherDiscountType;
  discount_value: number;
  max_discount?: number;
  min_order_value?: number;
  max_uses?: number;
  used_count?: number;
  expires_at?: string;
  status: VoucherStatus;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface VoucherValidateResult {
  valid: boolean;
  voucher?: Voucher;
  discount_amount: number;
  final_total: number;
  message?: string;
}

export interface CreateVoucherDTO {
  code: string;
  discount_type: VoucherDiscountType;
  discount_value: number;
  max_discount?: number;
  min_order_value?: number;
  max_uses?: number;
  expires_at?: string;
  description?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const voucherService = {
  // ── Public ──────────────────────────────────────────────────────────────

  /**
   * GET /vouchers/public — list publicly visible vouchers
   */
  getPublicVouchers: () =>
    api
      .get<{ message: string; data: Voucher[] }>("/vouchers/public")
      .then((r) => r.data.data),

  /**
   * GET /vouchers/code/:code — get voucher by code
   */
  getVoucherByCode: (code: string) =>
    api
      .get<{ message: string; data: Voucher }>(`/vouchers/code/${code}`)
      .then((r) => r.data.data),

  /**
   * GET /vouchers/me — get current user's saved vouchers
   */
  getMyVouchers: () =>
    api
      .get<{ message: string; data: Voucher[] }>("/vouchers/me")
      .then((r) => r.data.data),

  /**
   * POST /vouchers/:id/save — save a voucher to user's collection
   */
  saveVoucher: (id: string) =>
    api
      .post<{ message: string }>(`/vouchers/${id}/save`, {})
      .then((r) => r.data),

  /**
   * DELETE /vouchers/:id/save — remove a voucher from user's collection
   */
  unsaveVoucher: (id: string) =>
    api
      .delete<{ message: string }>(`/vouchers/${id}/save`)
      .then((r) => r.data),

  /**
   * POST /vouchers/validate — validate a voucher code against course IDs
   */
  validate: (code: string, courseIds: string[]) =>
    api
      .post<{ message: string; data: VoucherValidateResult }>("/vouchers/validate", {
        code,
        course_ids: courseIds,
      })
      .then((r) => r.data.data),

  /**
   * POST /vouchers/:code/apply — apply a voucher to an order
   */
  apply: (code: string, orderId: string) =>
    api
      .post<{ message: string; data: { discount_amount: number; final_total: number } }>(
        `/vouchers/${code}/apply`,
        { order_id: orderId }
      )
      .then((r) => r.data.data),

  // ── Admin ────────────────────────────────────────────────────────────────

  /**
   * GET /vouchers — list all vouchers (admin)
   */
  getAllVouchers: () =>
    api
      .get<{ message: string; data: Voucher[] }>("/vouchers")
      .then((r) => r.data.data),

  /**
   * POST /vouchers — create a voucher (admin)
   */
  createVoucher: (dto: CreateVoucherDTO) =>
    api
      .post<{ message: string; data: Voucher }>("/vouchers", dto)
      .then((r) => r.data.data),

  /**
   * PUT /vouchers/:id — update a voucher (admin)
   */
  updateVoucher: (id: string, dto: Partial<CreateVoucherDTO>) =>
    api
      .put<{ message: string; data: Voucher }>(`/vouchers/${id}`, dto)
      .then((r) => r.data.data),

  /**
   * DELETE /vouchers/:id — delete a voucher (admin)
   */
  deleteVoucher: (id: string) =>
    api
      .delete<{ message: string }>(`/vouchers/${id}`)
      .then((r) => r.data),

  /**
   * POST /vouchers/:id/restore — restore a deleted voucher (admin)
   */
  restoreVoucher: (id: string) =>
    api
      .post<{ message: string }>(`/vouchers/${id}/restore`, {})
      .then((r) => r.data),

  /**
   * POST /vouchers/:id/activate — activate a voucher (admin)
   */
  activateVoucher: (id: string) =>
    api
      .post<{ message: string }>(`/vouchers/${id}/activate`, {})
      .then((r) => r.data),

  /**
   * POST /vouchers/:id/deactivate — deactivate a voucher (admin)
   */
  deactivateVoucher: (id: string) =>
    api
      .post<{ message: string }>(`/vouchers/${id}/deactivate`, {})
      .then((r) => r.data),

  /**
   * GET /vouchers/:id/stats — get usage stats for a voucher (admin)
   */
  getVoucherStats: (id: string) =>
    api
      .get<{ message: string; data: { total_uses: number; total_discount: number } }>(
        `/vouchers/${id}/stats`
      )
      .then((r) => r.data.data),
};
