"use client";

/**
 * VoucherInput - inline voucher code field with Apply button
 * Calls validateVoucher and surfaces result to parent via onApplied callback
 */

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { useValidateVoucher } from "@/hooks/queries/use-voucher";
import type { VoucherValidateResponse } from "@/types/voucher";

interface VoucherInputProps {
  coursePrice: number;
  onApplied: (result: VoucherValidateResponse | null) => void;
  className?: string;
}

export function VoucherInput({ coursePrice, onApplied, className }: VoucherInputProps) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<VoucherValidateResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateMutation = useValidateVoucher();

  function handleApply() {
    const trimmed = code.trim();
    if (!trimmed) return;

    setErrorMessage(null);
    validateMutation.mutate(
      { code: trimmed, coursePrice },
      {
        onSuccess(result) {
          if (result.valid) {
            setApplied(result);
            onApplied(result);
          } else {
            setErrorMessage(result.message ?? "Mã không hợp lệ");
            setApplied(null);
            onApplied(null);
          }
        },
        onError() {
          setErrorMessage("Không thể kiểm tra voucher, thử lại sau");
        },
      }
    );
  }

  function handleRemove() {
    setCode("");
    setApplied(null);
    setErrorMessage(null);
    onApplied(null);
  }

  if (applied?.valid) {
    return (
      <div className={cn("flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2", className)}>
        <div className="flex items-center gap-2 text-green-700">
          <Tag className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">{applied.voucher?.code}</span>
          <span className="text-sm">— Giảm {formatCurrency(applied.discountAmount)}</span>
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
          disabled={validateMutation.isPending}
        />
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={!code.trim() || validateMutation.isPending}
          className="shrink-0"
        >
          {validateMutation.isPending ? "Đang kiểm tra..." : "Áp dụng"}
        </Button>
      </div>
      {errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
