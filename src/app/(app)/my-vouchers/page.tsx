"use client";

/**
 * My Vouchers page - lists user's vouchers with status and expiry info
 */

import { Ticket, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useMyVouchersWithDetails, type MyVoucherWithDetails } from "@/hooks/queries/use-voucher";
import { formatVoucherDiscountLabel, type Voucher } from "@/services/voucher.service";

// ─── Status config ──────────────────────────────────────────────────────────

type VoucherStatus = "active" | "inactive" | "expired";

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
  inactive: {
    label: "Không hoạt động",
    className: "bg-gray-100 text-gray-500 border-gray-200",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  expired: {
    label: "Hết hạn",
    className: "bg-red-50 text-red-600 border-red-200",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
};

/** Derive a display status from voucher fields */
function getVoucherStatus(v: Voucher): VoucherStatus {
  if (!v.is_active) return "inactive";
  if (v.end_date && new Date(v.end_date) < new Date()) return "expired";
  return "active";
}

// ─── Voucher card ────────────────────────────────────────────────────────────

function VoucherCard({ entry }: { entry: MyVoucherWithDetails }) {
  const voucher = entry.voucher;

  if (!voucher) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm text-gray-400">
        Không tải được chi tiết voucher (đã lưu lúc{" "}
        {new Date(entry.saved_at).toLocaleDateString("vi-VN")})
      </div>
    );
  }

  const derivedStatus = getVoucherStatus(voucher);
  const effectiveStatus = STATUS_CONFIG[derivedStatus];
  const discountLabel = formatVoucherDiscountLabel(voucher);
  const minPurchase = Number(voucher.min_purchase_money ?? 0);

  const expiryDate = voucher.end_date
    ? new Date(voucher.end_date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-shadow",
        derivedStatus === "active"
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
        {minPurchase > 0 ? (
          <span>Đơn tối thiểu {formatCurrency(minPurchase)}</span>
        ) : (
          <span>Không yêu cầu đơn tối thiểu</span>
        )}
        {expiryDate && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            HSD: {expiryDate}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MyVouchersPage() {
  const { data: entries = [], isLoading, isError } = useMyVouchersWithDetails();

  const activeEntries = entries.filter((e) => e.voucher && getVoucherStatus(e.voucher) === "active");
  const inactiveEntries = entries.filter((e) => !e.voucher || getVoucherStatus(e.voucher) !== "active");

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

      {!isLoading && !isError && entries.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-gray-400">
          <Ticket className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Bạn chưa có voucher nào</p>
        </div>
      )}

      {activeEntries.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Có thể sử dụng ({activeEntries.length})
          </h2>
          <div className="space-y-3">
            {activeEntries.map((e) => (
              <VoucherCard key={e.id} entry={e} />
            ))}
          </div>
        </section>
      )}

      {inactiveEntries.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Đã dùng / Hết hạn ({inactiveEntries.length})
          </h2>
          <div className="space-y-3">
            {inactiveEntries.map((e) => (
              <VoucherCard key={e.id} entry={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
