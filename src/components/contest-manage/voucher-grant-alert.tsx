"use client";

/**
 * Alert CỐ ĐỊNH (không tự tắt) khi chốt kết quả bị rollback vì voucher của giải không phát được
 * (409 CONTEST_VOUCHER_UNAVAILABLE + `details`, ĐÍNH CHÍNH 3). Chỉ rõ người thắng, hạng, mã voucher
 * và lý do, kèm đường dẫn tới phần "Cơ cấu giải" để admin đổi voucher rồi chốt lại.
 */

import { AlertTriangle } from "lucide-react";

import { voucherGrantLabel, type VoucherGrantError } from "@/lib/contest-manage/voucher-grant-error";

interface Props {
  error: VoucherGrantError;
  onDismiss: () => void;
}

export function VoucherGrantAlert({ error, onDismiss }: Props) {
  const { details } = error;
  return (
    <div
      role="alert"
      data-testid="voucher-grant-alert"
      className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
    >
      <p className="flex items-start gap-2 font-semibold">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Chưa chốt được kết quả: voucher của giải không phát được. Không có gì được phát, dữ liệu giữ nguyên.
      </p>
      <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
        <dt className="font-medium">Người thắng</dt>
        <dd className="break-words" data-testid="grant-user">{details.user_name}</dd>
        <dt className="font-medium">Hạng</dt>
        <dd data-testid="grant-rank">{details.rank}</dd>
        <dt className="font-medium">Voucher</dt>
        <dd className="break-words" data-testid="grant-voucher">{voucherGrantLabel(details)}</dd>
        <dt className="font-medium">Lý do</dt>
        <dd className="break-words" data-testid="grant-reason">{details.reason}</dd>
      </dl>
      {error.message && <p className="break-words text-xs opacity-80">{error.message}</p>}
      <div className="flex flex-wrap gap-3">
        <a
          href="#contest-prizes"
          data-testid="grant-fix-prizes"
          className="font-medium underline"
          onClick={() => document.getElementById("contest-prizes")?.focus()}
        >
          Sửa giải hạng {details.rank} rồi chốt lại
        </a>
        <button type="button" className="underline opacity-80" onClick={onDismiss}>
          Đóng thông báo
        </button>
      </div>
    </div>
  );
}
