/**
 * Mô hình form voucher của admin (L1): dựng body POST/PUT /vouchers từ state form và kiểm hợp lệ
 * theo đúng luật backend (voucher_service.CreateVoucher / UpdateVoucher), để lỗi hiện ngay tại form
 * thay vì chờ 400 từ server.
 *
 * `holders_only` (voucher "dành riêng"): chỉ người đã được cấp (vd thưởng cuộc thi) hoặc đã lưu mới
 * dùng được; người khác nhập mã nhận lỗi như mã không tồn tại. Mặc định TẮT = công khai như trước.
 */

import type {
  CreateVoucherDTO,
  UpdateVoucherDTO,
  Voucher,
  VoucherDiscountMethod,
  VoucherDiscountUnit,
} from "@/services/voucher.service";

export interface VoucherFormState {
  code: string;
  name: string;
  description: string;
  discount_unit: VoucherDiscountUnit;
  discount_method: VoucherDiscountMethod;
  /** Số tiền (MONEY+FIXED) hoặc số điểm (POINT+FIXED) giảm. */
  discount_amount: string;
  /** Phần trăm giảm, 0-100 (PERCENT). */
  discount_percent: string;
  /** Trần giảm (tiền hoặc điểm, theo discount_unit) cho PERCENT; trống = không trần. */
  max_discount: string;
  min_purchase_money: string;
  /** 0 = không giới hạn. */
  usage_limit: string;
  usage_per_user: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  holders_only: boolean;
}

export const emptyVoucherForm: VoucherFormState = {
  code: "",
  name: "",
  description: "",
  discount_unit: "MONEY",
  discount_method: "FIXED",
  discount_amount: "",
  discount_percent: "",
  max_discount: "",
  min_purchase_money: "",
  usage_limit: "0",
  usage_per_user: "1",
  start_date: "",
  end_date: "",
  is_active: true,
  holders_only: false,
};

/** Nhãn hiển thị của voucher dành riêng (dùng chung form admin và trang "Voucher của tôi"). */
export const HOLDERS_ONLY_LABEL = "Dành riêng";
export const HOLDERS_ONLY_HINT =
  "Chỉ người được cấp (vd thưởng cuộc thi) hoặc đã lưu voucher mới dùng được. Người khác nhập mã sẽ thấy báo mã không hợp lệ.";

function numText(v: number | string | null | undefined): string {
  if (v === undefined || v === null || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : "";
}

/** "2026-10-01T10:00:00Z" -> "2026-10-01T10:00" theo giờ máy (đúng định dạng input datetime-local). */
function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Điền sẵn form sửa từ voucher hiện có. */
export function voucherToForm(v: Voucher): VoucherFormState {
  const isMoney = v.discount_unit === "MONEY";
  const isPercent = v.discount_method === "PERCENT";
  return {
    code: v.code,
    name: v.name,
    description: v.description ?? "",
    discount_unit: v.discount_unit,
    discount_method: v.discount_method,
    discount_amount: isPercent ? "" : numText(isMoney ? v.discount_amount_money : v.discount_amount_points),
    discount_percent: isPercent ? numText(v.discount_percent) : "",
    max_discount: isPercent ? numText(isMoney ? v.max_discount_money : v.max_discount_points) : "",
    min_purchase_money: numText(v.min_purchase_money),
    usage_limit: numText(v.usage_limit) || "0",
    usage_per_user: numText(v.usage_per_user) || "0",
    start_date: toDateTimeLocal(v.start_date),
    end_date: toDateTimeLocal(v.end_date),
    is_active: v.is_active,
    holders_only: !!v.holders_only,
  };
}

function nonNegative(text: string): number | null {
  if (text.trim() === "") return null;
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export type VoucherBuildResult<T> = { payload: T; error?: undefined } | { payload?: undefined; error: string };

/** Kiểm các trường dùng chung cho tạo và sửa; trả câu lỗi đầu tiên hoặc null. */
function validateShared(f: VoucherFormState, isCreate: boolean): string | null {
  if (isCreate && (f.code.trim().length < 3 || f.code.trim().length > 50)) return "Mã voucher dài 3-50 ký tự.";
  if (f.name.trim().length < 3) return "Tên voucher tối thiểu 3 ký tự.";

  if (f.discount_method === "PERCENT") {
    const p = Number(f.discount_percent);
    if (f.discount_percent.trim() === "" || !Number.isFinite(p) || p <= 0 || p > 100) {
      return "Phần trăm giảm phải lớn hơn 0 và không quá 100.";
    }
    if (Number.isNaN(nonNegative(f.max_discount))) return "Mức giảm tối đa phải là số không âm.";
  } else {
    const a = Number(f.discount_amount);
    if (f.discount_amount.trim() === "" || !Number.isFinite(a) || a <= 0) {
      return f.discount_unit === "MONEY" ? "Số tiền giảm phải lớn hơn 0." : "Số điểm giảm phải lớn hơn 0.";
    }
  }

  for (const [label, text] of [
    ["Đơn tối thiểu", f.min_purchase_money],
    ["Tổng số lượt dùng", f.usage_limit],
    ["Số lượt mỗi người", f.usage_per_user],
  ] as const) {
    if (Number.isNaN(nonNegative(text))) return `${label} phải là số không âm.`;
  }

  if (f.start_date && f.end_date && new Date(f.end_date).getTime() <= new Date(f.start_date).getTime()) {
    return "Ngày kết thúc phải sau ngày bắt đầu.";
  }
  return null;
}

/** Các trường giảm giá theo (unit, method) — khớp bảng trong voucher_service.CreateVoucher. */
function discountFields(f: VoucherFormState): Partial<CreateVoucherDTO> {
  const isMoney = f.discount_unit === "MONEY";
  if (f.discount_method === "PERCENT") {
    const out: Partial<CreateVoucherDTO> = { discount_percent: Number(f.discount_percent) };
    const cap = nonNegative(f.max_discount);
    if (cap !== null) out[isMoney ? "max_discount_money" : "max_discount_points"] = cap;
    return out;
  }
  const amount = Number(f.discount_amount);
  return isMoney ? { discount_amount_money: amount } : { discount_amount_points: amount };
}

function optionalNumbers(f: VoucherFormState) {
  const out: { min_purchase_money?: number; usage_limit?: number; usage_per_user?: number } = {};
  const min = nonNegative(f.min_purchase_money);
  if (min !== null) out.min_purchase_money = min;
  const limit = nonNegative(f.usage_limit);
  if (limit !== null) out.usage_limit = limit;
  const perUser = nonNegative(f.usage_per_user);
  if (perUser !== null) out.usage_per_user = perUser;
  return out;
}

export function buildCreateVoucherPayload(f: VoucherFormState): VoucherBuildResult<CreateVoucherDTO> {
  const error = validateShared(f, true);
  if (error) return { error };
  const payload: CreateVoucherDTO = {
    code: f.code.trim().toUpperCase(),
    name: f.name.trim(),
    description: f.description.trim(),
    discount_unit: f.discount_unit,
    discount_method: f.discount_method,
    accept_all_payment_methods: true,
    ...discountFields(f),
    ...optionalNumbers(f),
    is_active: f.is_active,
    // Luôn gửi tường minh (kể cả false) để không phụ thuộc mặc định của backend.
    holders_only: f.holders_only,
  };
  if (f.start_date) payload.start_date = new Date(f.start_date).toISOString();
  if (f.end_date) payload.end_date = new Date(f.end_date).toISOString();
  return { payload };
}

/** Body PUT /vouchers/:id — backend không cho đổi mã, loại giảm hay cách giảm nên không gửi các trường đó. */
export function buildUpdateVoucherPayload(f: VoucherFormState): VoucherBuildResult<UpdateVoucherDTO> {
  const error = validateShared(f, false);
  if (error) return { error };
  const d = discountFields(f);
  const payload: UpdateVoucherDTO = {
    name: f.name.trim(),
    description: f.description.trim(),
    ...(d.discount_amount_money !== undefined && { discount_amount_money: d.discount_amount_money }),
    ...(d.discount_amount_points !== undefined && { discount_amount_points: d.discount_amount_points }),
    ...(d.discount_percent !== undefined && { discount_percent: d.discount_percent }),
    ...(d.max_discount_money !== undefined && { max_discount_money: d.max_discount_money }),
    ...(d.max_discount_points !== undefined && { max_discount_points: d.max_discount_points }),
    ...optionalNumbers(f),
    is_active: f.is_active,
    holders_only: f.holders_only,
  };
  if (f.start_date) payload.start_date = new Date(f.start_date).toISOString();
  if (f.end_date) payload.end_date = new Date(f.end_date).toISOString();
  return { payload };
}
