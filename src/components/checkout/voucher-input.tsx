"use client";

/**
 * VoucherInput - inline voucher code field with Apply button
 * Calls voucherService.getVoucherByCode, tính discount tại client (backend
 * chưa có endpoint validate tiền cho voucher — xem calculateVoucherDiscount),
 * rồi báo kết quả cho parent qua onApplied callback.
 */

import { useEffect, useState } from "react";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { useVoucherLookup } from "@/hooks/queries/use-voucher";
import { calculateVoucherDiscount, type Voucher as ServiceVoucher } from "@/services/voucher.service";
import type { VoucherValidateResponse } from "@/types/voucher";

interface VoucherInputProps {
  /** Course ID(s) áp dụng voucher — dùng để hiển thị ngữ cảnh, chưa gửi lên backend */
  courseIds: string[];
  onApplied: (result: VoucherValidateResponse | null) => void;
  className?: string;
  /**
   * Tổng tiền trước giảm giá (VND) — bắt buộc để tính đúng voucher PERCENT
   * và kiểm tra min_purchase_money. Nếu không truyền, mặc định 0 (voucher
   * PERCENT/có mức tối thiểu sẽ báo không áp dụng được).
   */
  subtotal?: number;
  /**
   * Mã voucher tiền-điền sẵn (vd từ `?voucher=` khi chuyển từ /cart sang
   * /checkout — M-01, giỏ hàng cho áp voucher nhưng checkout trước đây không
   * đọc lại param nên user phải nhập lại). Tự động áp dụng 1 lần khi mount.
   */
  initialCode?: string;
}

export function VoucherInput({
  courseIds,
  onApplied,
  className,
  subtotal = 0,
  initialCode,
}: VoucherInputProps) {
  const [code, setCode] = useState(initialCode ? initialCode.toUpperCase() : "");
  const [applied, setApplied] = useState<VoucherValidateResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lookupMutation = useVoucherLookup();

  function handleApply() {
    const trimmed = code.trim();
    if (!trimmed) return;

    setErrorMessage(null);
    lookupMutation.mutate(trimmed, {
      onSuccess(voucher: ServiceVoucher) {
        const calc = calculateVoucherDiscount(voucher, subtotal);
        if (!calc.ok) {
          setErrorMessage(calc.errorMessage ?? "Mã voucher không hợp lệ");
          setApplied(null);
          onApplied(null);
          return;
        }
        const result: VoucherValidateResponse = {
          valid: true,
          voucher: { id: voucher.id, code: voucher.code },
          discount_amount: calc.discountAmount,
        };
        setApplied(result);
        onApplied(result);
      },
      onError() {
        setErrorMessage("Không tìm thấy voucher hoặc mã không hợp lệ");
        setApplied(null);
        onApplied(null);
      },
    });
  }

  function handleRemove() {
    setCode("");
    setApplied(null);
    setErrorMessage(null);
    onApplied(null);
  }

  // M-01: chỉ tự áp dụng 1 lần lúc mount (không phụ thuộc `subtotal` đổi theo
  // mỗi lần tick chọn khóa — người dùng vẫn bấm "Áp dụng" lại nếu muốn).
  useEffect(() => {
    if (initialCode) handleApply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (applied?.valid) {
    return (
      <div className={cn("flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2", className)}>
        <div className="flex items-center gap-2 text-green-700">
          <Tag className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">{applied.voucher?.code}</span>
          <span className="text-sm">— Giảm {formatCurrency(applied.discount_amount)}</span>
        </div>
        <button onClick={handleRemove} className="p-1 hover:bg-green-100 rounded" aria-label="Xóa voucher">
          <X className="h-4 w-4 text-green-600" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-2">
        <Input
          placeholder="Nhập mã voucher"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setErrorMessage(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          className="flex-1 uppercase placeholder:normal-case"
          disabled={lookupMutation.isPending}
        />
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={!code.trim() || lookupMutation.isPending}
          className="shrink-0"
        >
          {lookupMutation.isPending ? "Đang kiểm tra..." : "Áp dụng"}
        </Button>
      </div>
      {errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
      {courseIds.length === 0 && (
        <p className="sr-only">Không có khóa học nào để áp dụng voucher</p>
      )}
    </div>
  );
}
