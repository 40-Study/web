"use client";

/**
 * My Vouchers page - lists user's vouchers with status and expiry info
 */

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ticket, Clock, CheckCircle, XCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { useMyVouchersWithDetails, type MyVoucherWithDetails } from "@/hooks/queries/use-voucher";
import { formatVoucherDiscountLabel, type Voucher } from "@/services/voucher.service";

// ─── Status config ──────────────────────────────────────────────────────────

type VoucherStatus = "active" | "inactive" | "expired" | "unavailable";

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
  // Voucher còn hiệu lực nhưng backend báo người này chưa dùng được (hết lượt, chỉ đơn đầu tiên, chưa đến ngày...).
  unavailable: {
    label: "Chưa dùng được",
    className: "bg-gray-100 text-gray-500 border-gray-200",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

/** Derive a display status from voucher fields */
function getVoucherStatus(v: Voucher): VoucherStatus {
  if (!v.is_active) return "inactive";
  if (v.end_date && new Date(v.end_date) < new Date()) return "expired";
  return "active";
}

/**
 * Dùng được ngay hay không: `eligible` của backend là nguồn đúng (cùng luật với đường áp mã). Backend cũ chưa trả
 * field này thì suy ra từ trạng thái voucher như trước.
 */
export function isVoucherEligible(entry: MyVoucherWithDetails): boolean {
  if (!entry.voucher) return false;
  if (typeof entry.eligible === "boolean") return entry.eligible;
  return getVoucherStatus(entry.voucher) === "active";
}

/** Lý do không dùng được để hiển thị; rỗng khi dùng được. */
function ineligibleReason(entry: MyVoucherWithDetails): string {
  if (isVoucherEligible(entry)) return "";
  const fromBackend = entry.ineligible_reason?.trim();
  if (fromBackend) return fromBackend;
  const status = entry.voucher ? getVoucherStatus(entry.voucher) : "inactive";
  if (status === "expired") return "Voucher đã hết hạn";
  return "Voucher hiện chưa dùng được";
}

// ─── Voucher card ────────────────────────────────────────────────────────────

function VoucherCard({ entry }: { entry: MyVoucherWithDetails }) {
  const voucher = entry.voucher;
  const router = useRouter();

  if (!voucher) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm text-gray-400">
        Không tải được chi tiết voucher (đã lưu lúc{" "}
        {new Date(entry.saved_at).toLocaleDateString("vi-VN")})
      </div>
    );
  }

  const eligible = isVoucherEligible(entry);
  const reason = ineligibleReason(entry);
  const baseStatus = getVoucherStatus(voucher);
  const derivedStatus: VoucherStatus = baseStatus === "active" && !eligible ? "unavailable" : baseStatus;
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

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      toast.success(`Đã sao chép mã ${voucher.code}`);
      return true;
    } catch {
      toast.error("Chưa sao chép được. Bạn có thể chọn và sao chép mã trên thẻ.");
      return false;
    }
  };

  // Giỏ hàng chưa nhận mã qua URL, nên "Dùng ngay" sao chép mã rồi mở giỏ để dán vào ô "Mã giảm giá".
  const useNow = async () => {
    await copyCode();
    router.push("/cart");
  };

  return (
    <div
      data-testid={eligible ? "voucher-eligible" : "voucher-ineligible"}
      className={cn(
        "relative rounded-xl border p-4 transition-shadow",
        eligible ? "bg-white shadow-sm hover:shadow-md" : "bg-gray-50 opacity-70"
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
      <p className="text-sm font-semibold text-primary-600 mb-1">
        {discountLabel}
        {voucher.holders_only && (
          <span
            data-testid="holders-only-badge"
            title="Voucher dành riêng cho bạn: người khác không dùng được"
            className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 align-middle text-xs font-medium text-amber-700 ring-1 ring-amber-200"
          >
            Dành riêng cho bạn
          </span>
        )}
      </p>

      {/* Description */}
      {voucher.description && (
        <p className="text-sm text-gray-500 mb-2">{voucher.description}</p>
      )}

      {!eligible && (
        <p data-testid="voucher-ineligible-reason" className="mb-2 text-sm font-medium text-red-600">
          {reason}
        </p>
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

      {eligible && (
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={copyCode} aria-label={`Sao chép mã ${voucher.code}`}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Sao chép
          </Button>
          <Button size="sm" onClick={useNow}>
            Dùng ngay
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MyVouchersPage() {
  const { data: entries = [], isLoading, isError } = useMyVouchersWithDetails();

  const activeEntries = entries.filter(isVoucherEligible);
  const inactiveEntries = entries.filter((e) => !isVoucherEligible(e));

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Voucher của tôi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Các mã giảm giá bạn có thể sử dụng khi mua khoá học
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
            Chưa dùng được ({inactiveEntries.length})
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
