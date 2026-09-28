"use client";

/**
 * Sửa cơ cấu giải (khoảng hạng → chứng nhận / voucher).
 * `allowVoucher=false` (form giảng viên): KHÔNG render ô voucher — giảng viên không được gắn voucher
 * (contract §7, backend 403 CONTEST_VOUCHER_ADMIN_ONLY). Chỉ trang admin truyền `voucherOptions`.
 */

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CONTEST_MAX_PRIZES, type PrizeDraft } from "@/lib/contest-manage/form";

export interface VoucherOption {
  id: string;
  label: string;
}

interface PrizeEditorProps {
  value: PrizeDraft[];
  onChange: (next: PrizeDraft[]) => void;
  allowVoucher: boolean;
  voucherOptions?: VoucherOption[];
  error?: string;
  disabled?: boolean;
}

const FIELD =
  "h-9 w-full rounded-lg border border-gray-200 px-2 text-sm dark:border-gray-700 dark:bg-gray-900";

export function PrizeEditor({
  value,
  onChange,
  allowVoucher,
  voucherOptions = [],
  error,
  disabled,
}: PrizeEditorProps) {
  const update = (index: number, patch: Partial<PrizeDraft>) =>
    onChange(value.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  const addPrize = () => {
    // Gợi ý hạng kế tiếp sau giải cuối để giảm lỗi chồng khoảng.
    const last = value[value.length - 1];
    const next = last && /^\d+$/.test(last.rank_to) ? Number(last.rank_to) + 1 : 1;
    onChange([
      ...value,
      { rank_from: String(next), rank_to: String(next), grant_certificate: true, voucher_id: null },
    ]);
  };

  return (
    <div className="space-y-3" data-testid="prize-editor">
      {value.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Chưa có giải nào. Cuộc thi vẫn xếp hạng, chỉ không trao thưởng theo hạng.
        </p>
      )}
      {value.map((prize, index) => (
        <div
          key={index}
          data-testid={`prize-row-${index}`}
          className="grid gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[repeat(2,minmax(0,6rem))_1fr_auto] sm:items-end dark:border-gray-700"
        >
          <label className="text-xs text-gray-600 dark:text-gray-300">
            Từ hạng
            <input
              type="number"
              min={1}
              max={100}
              inputMode="numeric"
              value={prize.rank_from}
              disabled={disabled}
              onChange={(e) => update(index, { rank_from: e.target.value })}
              className={FIELD}
              aria-label={`Giải ${index + 1} từ hạng`}
            />
          </label>
          <label className="text-xs text-gray-600 dark:text-gray-300">
            Đến hạng
            <input
              type="number"
              min={1}
              max={100}
              inputMode="numeric"
              value={prize.rank_to}
              disabled={disabled}
              onChange={(e) => update(index, { rank_to: e.target.value })}
              className={FIELD}
              aria-label={`Giải ${index + 1} đến hạng`}
            />
          </label>
          <div className="flex min-w-0 flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={prize.grant_certificate}
                disabled={disabled}
                onChange={(e) => update(index, { grant_certificate: e.target.checked })}
              />
              Trao chứng nhận
            </label>
            {allowVoucher && (
              <select
                value={prize.voucher_id ?? ""}
                disabled={disabled}
                onChange={(e) => update(index, { voucher_id: e.target.value || null })}
                className={FIELD}
                aria-label={`Giải ${index + 1} voucher`}
                data-testid={`prize-voucher-${index}`}
              >
                <option value="">Không tặng voucher</option>
                {voucherOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <Button
            type="button"
            variant="destructiveGhost"
            size="icon"
            disabled={disabled}
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            aria-label={`Xoá giải ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {error && (
        <p role="alert" className="text-sm text-red-600" data-testid="prize-error">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addPrize}
        disabled={disabled || value.length >= CONTEST_MAX_PRIZES}
      >
        <Plus className="mr-1 h-4 w-4" />
        Thêm giải
      </Button>
    </div>
  );
}
