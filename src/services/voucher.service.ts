/**
 * Voucher service — public, user, and admin voucher management
 * Endpoints: /vouchers
 *
 * LƯU Ý: các handler voucher ở backend KHÔNG dùng envelope {message, data}
 * như phần lớn API khác — chúng trả model.Voucher / model.UserVoucher trực
 * tiếp, hoặc {vouchers, total_count, limit, offset} cho danh sách. Đã đối
 * chiếu internal/handler/voucher_handler.go (2026-09-09) — không unwrap
 * `.data.data` ở đây như các service khác.
 */

import { api } from "@/lib/api-client";

// ─── Types (khớp internal/model/payment.go#Voucher) ────────────────────────

export type VoucherDiscountUnit = "MONEY" | "POINT";
export type VoucherDiscountMethod = "FIXED" | "PERCENT";

export interface Voucher {
  id: string;
  code: string;
  name: string;
  description?: string;

  discount_unit: VoucherDiscountUnit;
  discount_method: VoucherDiscountMethod;

  discount_amount_money?: number | null;
  discount_amount_points?: number;
  discount_percent?: number | null;

  max_discount_money?: number | null;
  max_discount_points?: number;

  min_purchase_money?: number | null;
  min_purchase_points?: number;

  accept_all_payment_methods?: boolean;
  payment_methods_accepted?: string[];

  used_count?: number;
  usage_limit?: number;
  usage_per_user?: number;
  can_stack?: boolean;

  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
}

export interface CreateVoucherDTO {
  code: string;
  name: string;
  description?: string;
  discount_unit: VoucherDiscountUnit;
  discount_method: VoucherDiscountMethod;
  discount_amount_money?: number;
  discount_amount_points?: number;
  discount_percent?: number;
  max_discount_money?: number;
  max_discount_points?: number;
  min_purchase_money?: number;
  min_purchase_points?: number;
  accept_all_payment_methods?: boolean;
  payment_methods_accepted?: string[];
  usage_limit?: number;
  usage_per_user?: number;
  can_stack?: boolean;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface UpdateVoucherDTO {
  name?: string;
  description?: string;
  discount_amount_money?: number;
  discount_amount_points?: number;
  discount_percent?: number;
  max_discount_money?: number;
  max_discount_points?: number;
  min_purchase_money?: number;
  min_purchase_points?: number;
  usage_limit?: number;
  usage_per_user?: number;
  can_stack?: boolean;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface UserSavedVoucher {
  id: string;
  user_id: string;
  voucher_id: string;
  saved_at: string;
  source: string;
  notes?: string;
  // H-02: backend giờ preload quan hệ Voucher trong GET /vouchers/me (trước
  // đây field này mang tag json:"-" nên FE phải join qua GET /vouchers/:id
  // — route đó yêu cầu quyền admin SYSTEM_SETTINGS_MANAGE, luôn 403 với user
  // thường). null khi voucher gốc đã bị xóa.
  voucher?: Voucher | null;
}

interface VoucherListResponse {
  vouchers: Voucher[];
  total_count: number;
  limit: number;
  offset: number;
}

interface SavedVoucherListResponse {
  vouchers: UserSavedVoucher[];
  total_count: number;
  limit: number;
  offset: number;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const voucherService = {
  // ── Public ────────────────────────────────────────────────────────────────

  /** GET /vouchers/public */
  getPublicVouchers: () =>
    api.get<VoucherListResponse>("/vouchers/public").then((r) => r.data.vouchers),

  /** GET /vouchers/code/:code */
  getVoucherByCode: (code: string) =>
    api.get<Voucher>(`/vouchers/code/${encodeURIComponent(code)}`).then((r) => r.data),

  // ── User ──────────────────────────────────────────────────────────────────

  /** GET /vouchers/me — saved vouchers (chưa kèm chi tiết voucher) */
  getMyVouchers: () =>
    api.get<SavedVoucherListResponse>("/vouchers/me").then((r) => r.data.vouchers),

  /** POST /vouchers/:id/save */
  saveVoucher: (id: string) =>
    api.post<UserSavedVoucher>(`/vouchers/${id}/save`, {}).then((r) => r.data),

  /** DELETE /vouchers/:id/save */
  unsaveVoucher: (id: string) =>
    api.delete<{ message: string }>(`/vouchers/${id}/save`).then((r) => r.data),

  // ── Admin ─────────────────────────────────────────────────────────────────

  /** POST /vouchers */
  createVoucher: (dto: CreateVoucherDTO) =>
    api.post<Voucher>("/vouchers", dto).then((r) => r.data),

  /** GET /vouchers?limit=&offset= */
  getAllVouchers: (params?: { limit?: number; offset?: number; keyword?: string }) =>
    api.get<VoucherListResponse>("/vouchers", { params }).then((r) => r.data),

  /** GET /vouchers/:id */
  getVoucherById: (id: string) =>
    api.get<Voucher>(`/vouchers/${id}`).then((r) => r.data),

  /** PUT /vouchers/:id */
  updateVoucher: (id: string, dto: UpdateVoucherDTO) =>
    api.put<Voucher>(`/vouchers/${id}`, dto).then((r) => r.data),

  /** DELETE /vouchers/:id */
  deleteVoucher: (id: string) =>
    api.delete<{ message: string }>(`/vouchers/${id}`).then((r) => r.data),

  /** POST /vouchers/:id/restore */
  restoreVoucher: (id: string) =>
    api.post<{ message: string }>(`/vouchers/${id}/restore`, {}).then((r) => r.data),

  /** POST /vouchers/:id/activate */
  activateVoucher: (id: string) =>
    api.post<{ message: string }>(`/vouchers/${id}/activate`, {}).then((r) => r.data),

  /** POST /vouchers/:id/deactivate */
  deactivateVoucher: (id: string) =>
    api.post<{ message: string }>(`/vouchers/${id}/deactivate`, {}).then((r) => r.data),

  /** GET /vouchers/:id/stats */
  getVoucherStats: (id: string) =>
    api
      .get<{ total_used: number; total_discount: number }>(`/vouchers/${id}/stats`)
      .then((r) => r.data),
};

// ─── Discount calculation (client-side preview — backend chưa có endpoint
// /vouchers/validate cho tiền, nên tính tại chỗ từ dữ liệu voucher công khai) ─

export interface VoucherApplyResult {
  ok: boolean;
  /** Số tiền được giảm, đã làm tròn xuống, không vượt quá subtotal */
  discountAmount: number;
  errorMessage?: string;
}

/**
 * Tính số tiền giảm cho một voucher MONEY áp dụng lên subtotal (VND).
 * Voucher loại POINT (đổi bằng điểm) không áp dụng cho thanh toán tiền mặt.
 */
export function calculateVoucherDiscount(voucher: Voucher, subtotal: number): VoucherApplyResult {
  if (!voucher.is_active) {
    return { ok: false, discountAmount: 0, errorMessage: "Voucher không còn hoạt động" };
  }

  const now = Date.now();
  if (voucher.start_date && now < new Date(voucher.start_date).getTime()) {
    return { ok: false, discountAmount: 0, errorMessage: "Voucher chưa đến ngày áp dụng" };
  }
  if (voucher.end_date && now > new Date(voucher.end_date).getTime()) {
    return { ok: false, discountAmount: 0, errorMessage: "Voucher đã hết hạn" };
  }
  if (
    typeof voucher.usage_limit === "number" &&
    voucher.usage_limit > 0 &&
    (voucher.used_count ?? 0) >= voucher.usage_limit
  ) {
    return { ok: false, discountAmount: 0, errorMessage: "Voucher đã hết lượt sử dụng" };
  }

  if (voucher.discount_unit !== "MONEY") {
    return {
      ok: false,
      discountAmount: 0,
      errorMessage: "Voucher này đổi bằng điểm, không áp dụng cho thanh toán tiền",
    };
  }

  const minPurchase = Number(voucher.min_purchase_money ?? 0);
  if (minPurchase > 0 && subtotal < minPurchase) {
    return {
      ok: false,
      discountAmount: 0,
      errorMessage: `Đơn hàng cần tối thiểu ${minPurchase.toLocaleString("vi-VN")}đ để dùng mã này`,
    };
  }

  let discount = 0;
  if (voucher.discount_method === "PERCENT") {
    const percent = Number(voucher.discount_percent ?? 0);
    discount = (subtotal * percent) / 100;
    const cap = Number(voucher.max_discount_money ?? 0);
    if (cap > 0) discount = Math.min(discount, cap);
  } else {
    discount = Number(voucher.discount_amount_money ?? 0);
  }

  discount = Math.max(0, Math.min(Math.floor(discount), subtotal));

  if (discount <= 0) {
    return { ok: false, discountAmount: 0, errorMessage: "Mã voucher không áp dụng được cho đơn này" };
  }

  return { ok: true, discountAmount: discount };
}

/** Nhãn hiển thị mức giảm của voucher, dùng cho danh sách/voucher card. */
export function formatVoucherDiscountLabel(voucher: Voucher): string {
  if (voucher.discount_unit !== "MONEY") {
    return `Giảm ${Number(voucher.discount_amount_points ?? 0).toLocaleString("vi-VN")} điểm`;
  }
  if (voucher.discount_method === "PERCENT") {
    const percent = Number(voucher.discount_percent ?? 0);
    const cap = Number(voucher.max_discount_money ?? 0);
    return `Giảm ${percent}%${cap > 0 ? ` (tối đa ${cap.toLocaleString("vi-VN")}đ)` : ""}`;
  }
  return `Giảm ${Number(voucher.discount_amount_money ?? 0).toLocaleString("vi-VN")}đ`;
}
