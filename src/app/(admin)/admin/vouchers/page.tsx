"use client";

import { useState } from "react";
import { AlertTriangle, Ticket } from "lucide-react";
import { QueryState } from "@/components/common/query-state";
import { Button } from "@/components/ui/button";
import { useAdminVouchers, useCreateVoucher, useUpdateVoucher } from "@/hooks/queries/use-voucher";
import { formatVoucherDiscountLabel, type Voucher } from "@/services/voucher.service";
import {
  HOLDERS_ONLY_ENABLE_NOTE,
  HOLDERS_ONLY_HINT,
  HOLDERS_ONLY_LABEL,
  buildCreateVoucherPayload,
  buildUpdateVoucherPayload,
  emptyVoucherForm,
  voucherToForm,
  type VoucherFormState,
} from "./voucher-form-model";

// Quản lý voucher (L1): backend đã có POST/PUT/GET /vouchers (quyền SYSTEM_SETTINGS_MANAGE) nhưng
// web chưa có trang nào để admin dùng. Trang này tạo/sửa voucher, gồm công tắc "Dành riêng"
// (holders_only). Mã, loại giảm và cách giảm không đổi được sau khi tạo (backend không cho sửa).

const inputClass = "h-10 w-full rounded border border-gray-200 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

export default function AdminVouchersPage() {
  // L6 mục 8: phân trang thật (trước đây chỉ tải 100 voucher đầu).
  const [page, setPage] = useState(1);
  const { data: pageData, isLoading, isError, refetch } = useAdminVouchers(page);
  const data = pageData?.vouchers ?? [];
  const totalPages = pageData?.totalPages ?? 1;
  const createVoucher = useCreateVoucher();
  const updateVoucher = useUpdateVoucher();

  const [form, setForm] = useState<VoucherFormState>(emptyVoucherForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof VoucherFormState>(key: K, value: VoucherFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(emptyVoucherForm);
    setEditingId(null);
    setError(null);
  };

  const startEdit = (v: Voucher) => {
    setForm(voucherToForm(v));
    setEditingId(v.id);
    setError(null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const result = buildUpdateVoucherPayload(form);
      if (result.error !== undefined) return setError(result.error);
      setError(null);
      updateVoucher.mutate({ id: editingId, dto: result.payload }, { onSuccess: reset });
      return;
    }
    const result = buildCreateVoucherPayload(form);
    if (result.error !== undefined) return setError(result.error);
    setError(null);
    createVoucher.mutate(result.payload, { onSuccess: reset });
  };

  const isPercent = form.discount_method === "PERCENT";
  const isMoney = form.discount_unit === "MONEY";
  const pending = createVoucher.isPending || updateVoucher.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Voucher</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tạo và sửa mã giảm giá. Voucher &quot;{HOLDERS_ONLY_LABEL}&quot; không hiện ở danh sách công khai và chỉ người đã được cấp mới dùng được.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={data.length === 0}
            emptyTitle="Chưa có voucher nào"
            onRetry={() => refetch()}
          >
            {data.map((v) => (
              <div
                key={v.id}
                data-testid="admin-voucher-row"
                className={`rounded-xl bg-white p-4 shadow-sm ${editingId === v.id ? "ring-2 ring-primary-200" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary-500" aria-hidden="true" />
                  <span className="font-mono font-bold tracking-wide text-gray-900">{v.code}</span>
                  {v.holders_only && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                      {HOLDERS_ONLY_LABEL}
                    </span>
                  )}
                  {!v.is_active && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Đang tắt</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-700">{v.name}</p>
                <p className="text-sm font-medium text-primary-600">{formatVoucherDiscountLabel(v)}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Đã dùng {v.used_count ?? 0}
                  {v.usage_limit ? `/${v.usage_limit}` : ""} lượt
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => startEdit(v)}
                    className="rounded bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
                  >
                    Sửa
                  </button>
                </div>
              </div>
            ))}
          </QueryState>

          {pageData && totalPages > 1 && (
            <nav className="flex items-center justify-between px-1 text-sm text-gray-500" aria-label="Phân trang voucher" data-testid="voucher-pagination">
              <span>
                Trang {page}/{totalPages} — {pageData.total} voucher
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border px-3 py-1 disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border px-3 py-1 disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </nav>
          )}
        </div>

        <form onSubmit={onSubmit} className="h-fit space-y-3 rounded-xl bg-white p-4 shadow-sm" data-testid="voucher-form">
          <h2 className="text-base font-semibold text-gray-900">{editingId ? "Cập nhật voucher" : "Tạo voucher mới"}</h2>

          <Field label="Mã voucher">
            <input
              className={inputClass}
              value={form.code}
              disabled={!!editingId}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="VD: GIAM50K"
            />
          </Field>
          <Field label="Tên voucher">
            <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Mô tả (tuỳ chọn)">
            <input className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Loại giảm">
              <select
                className={inputClass}
                value={form.discount_unit}
                disabled={!!editingId}
                onChange={(e) => set("discount_unit", e.target.value as VoucherFormState["discount_unit"])}
              >
                <option value="MONEY">Tiền (VNĐ)</option>
                <option value="POINT">Điểm</option>
              </select>
            </Field>
            <Field label="Cách giảm">
              <select
                className={inputClass}
                value={form.discount_method}
                disabled={!!editingId}
                onChange={(e) => set("discount_method", e.target.value as VoucherFormState["discount_method"])}
              >
                <option value="FIXED">Số cố định</option>
                <option value="PERCENT">Phần trăm</option>
              </select>
            </Field>
          </div>

          {isPercent ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Giảm (%)">
                <input className={inputClass} type="number" min={0} max={100} value={form.discount_percent} onChange={(e) => set("discount_percent", e.target.value)} />
              </Field>
              <Field label={isMoney ? "Giảm tối đa (VNĐ)" : "Giảm tối đa (điểm)"} hint={editingId ? "Để trống rồi lưu = bỏ trần giảm" : "Để trống = không giới hạn"}>
                <input className={inputClass} type="number" min={0} value={form.max_discount} onChange={(e) => set("max_discount", e.target.value)} />
              </Field>
            </div>
          ) : (
            <Field label={isMoney ? "Số tiền giảm (VNĐ)" : "Số điểm giảm"}>
              <input className={inputClass} type="number" min={0} value={form.discount_amount} onChange={(e) => set("discount_amount", e.target.value)} />
            </Field>
          )}

          <Field label="Đơn tối thiểu (VNĐ)" hint="Để trống = không yêu cầu">
            <input className={inputClass} type="number" min={0} value={form.min_purchase_money} onChange={(e) => set("min_purchase_money", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tổng số lượt dùng" hint="0 = không giới hạn">
              <input className={inputClass} type="number" min={0} value={form.usage_limit} onChange={(e) => set("usage_limit", e.target.value)} />
            </Field>
            <Field label="Lượt mỗi người" hint="0 = không giới hạn">
              <input className={inputClass} type="number" min={0} value={form.usage_per_user} onChange={(e) => set("usage_per_user", e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Bắt đầu" hint={editingId ? "Xoá ô này rồi lưu để bỏ ngày bắt đầu" : undefined}>
              <input className={inputClass} type="datetime-local" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </Field>
            <Field label="Kết thúc" hint={editingId ? "Xoá ô này rồi lưu để bỏ ngày kết thúc" : undefined}>
              <input className={inputClass} type="datetime-local" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
            Đang bật
          </label>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <label className="flex items-start gap-2 text-sm font-medium text-gray-800">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.holders_only}
                onChange={(e) => set("holders_only", e.target.checked)}
                aria-describedby="holders-only-hint"
              />
              <span>Voucher {HOLDERS_ONLY_LABEL.toLowerCase()}</span>
            </label>
            <p id="holders-only-hint" className="mt-1 pl-6 text-xs text-gray-600">
              {HOLDERS_ONLY_HINT}
            </p>
            {/* L6 mục 7: bật cho voucher đã công khai không thu hồi quyền người đã lưu. */}
            <p className="mt-1 pl-6 text-xs text-amber-800" data-testid="holders-only-enable-note">
              {HOLDERS_ONLY_ENABLE_NOTE}
            </p>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" isLoading={pending} disabled={pending}>
              {editingId ? "Lưu" : "Tạo voucher"}
            </Button>
            <Button type="button" variant="outline" onClick={reset} disabled={pending}>
              {editingId ? "Huỷ sửa" : "Làm mới"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
