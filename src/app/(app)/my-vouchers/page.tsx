"use client";

/**
 * My Vouchers page - lists user's vouchers with status and expiry info
 */

import { Ticket, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useMyVouchers } from "@/hooks/queries/use-voucher";
import type { Voucher, VoucherStatus } from "@/types/voucher";

// ─── Status config ──────────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  className: string;
  icon: React.ReactNode;
}

const STATUS_CONFIG: Record<VoucherStatus, StatusConfig> = {
  active: {
    label: "Còn hiệu lực",
    className: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  used: {
    label: "Đã sử dụng",
    className: "bg-gray-100 text-gray-500 border-gray-200",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  expired: {
    label: "Hết hạn",
    className: "bg-red-50 text-red-600 border-red-200",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
};

// ─── Voucher card ────────────────────────────────────────────────────────────

function VoucherCard({ voucher }: { voucher: Voucher }) {
  const status = STATUS_CONFIG[voucher.status];
  const isExpiredByDate = new Date(voucher.expiresAt) < new Date();
  const effectiveStatus =
    voucher.status === "active" && isExpiredByDate ? STATUS_CONFIG.expired : status;

  const discountLabel =
    voucher.discountType === "percentage"
      ? `Giảm ${voucher.discountValue}%${voucher.maxDiscount ? ` (tối đa ${formatCurrency(voucher.maxDiscount)})` : ""}`
      : `Giảm ${formatCurrency(voucher.discountValue)}`;

  const expiryDate = new Date(voucher.expiresAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-shadow",
        voucher.status === "active" && !isExpiredByDate
          ? "bg-white shadow-sm hover:shadow-md"
          : "bg-gray-50 opacity-70"
      )}
    >
      {/* Top row: code + status badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary-500 shrink-0" />
          <span className="font-mono font-bold text-base text-gray-900 tracking-wider">
            {voucher.code}
          </span>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0",
            effectiveStatus.className
          )}
        >
          {effectiveStatus.icon}
          {effectiveStatus.label}
        </span>
      </div>

      {/* Discount value */}
      <p className="text-sm font-semibold text-primary-600 mb-1">{discountLabel}</p>

      {/* Description */}
      {voucher.description && (
        <p className="text-sm text-gray-500 mb-2">{voucher.description}</p>
      )}

      {/* Footer: min order + expiry */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 border-t pt-2 mt-2">
        {voucher.minOrderValue ? (
          <span>Đơn tối thiểu {formatCurrency(voucher.minOrderValue)}</span>
        ) : (
          <span>Không yêu cầu đơn tối thiểu</span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          HSD: {expiryDate}
        </span>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MyVouchersPage() {
  const { data: vouchers = [], isLoading, isError } = useMyVouchers();

  const activeVouchers = vouchers.filter(
    (v) => v.status === "active" && new Date(v.expiresAt) >= new Date()
  );
  const inactiveVouchers = vouchers.filter(
    (v) => v.status !== "active" || new Date(v.expiresAt) < new Date()
  );

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Voucher của tôi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Các mã giảm giá bạn có thể sử dụng khi mua khóa học
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
          Không thể tải voucher. Vui lòng thử lại.
        </div>
      )}

      {!isLoading && !isError && vouchers.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-gray-400">
          <Ticket className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Bạn chưa có voucher nào</p>
        </div>
      )}

      {activeVouchers.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Có thể sử dụng ({activeVouchers.length})
          </h2>
          <div className="space-y-3">
            {activeVouchers.map((v) => (
              <VoucherCard key={v.id} voucher={v} />
            ))}
          </div>
        </section>
      )}

      {inactiveVouchers.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Đã dùng / Hết hạn ({inactiveVouchers.length})
          </h2>
          <div className="space-y-3">
            {inactiveVouchers.map((v) => (
              <VoucherCard key={v.id} voucher={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
