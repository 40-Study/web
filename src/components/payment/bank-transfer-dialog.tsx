"use client";

/**
 * Dialog chuyển khoản ngân hàng — component CHUNG dùng cho cả mua xu
 * (coins) và thanh toán đơn hàng khóa học (checkout), theo yêu cầu DRY ở
 * mục 12/13 (plans/reports/web-core-developer-260909-1412-web-logic-fixes.md).
 *
 * Component này THUẦN HIỂN THỊ — không tự gọi API. Logic polling/verify
 * khác nhau giữa coins (POST /coins/purchases/:id/verify) và order
 * (GET /orders/:id/payment-status + POST /orders/:id/check-payment) nên
 * nằm ở 2 hook riêng (`usePurchaseVerificationPolling`, `usePaymentStatus`)
 * — dialog chỉ nhận state đã tính sẵn qua props.
 */

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Copy, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export type BankTransferDialogStatus = "pending" | "success" | "error" | "expired";

export interface BankTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  /** Nội dung chuyển khoản — user PHẢI ghi đúng để hệ thống đối chiếu tự động. */
  paymentContent: string;
  /** ISO string — hạn chuyển khoản, dùng để đếm ngược. */
  expiresAt?: string | null;
  status: BankTransferDialogStatus;
  errorMessage?: string;
  successTitle?: string;
  successDescription?: React.ReactNode;
  /** Nút "Tôi đã chuyển khoản" — chỉ order có (coins không có endpoint ép check tương đương). */
  onCheckNow?: () => void;
  isCheckingNow?: boolean;
  onRetryExpired?: () => void;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => toast.success(`Đã sao chép ${label.toLowerCase()}`));
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
      <Button size="icon" variant="ghost" onClick={handleCopy} aria-label={`Sao chép ${label}`}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

function useCountdown(expiresAt?: string | null) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(null);
      return;
    }
    const deadline = new Date(expiresAt).getTime();
    const tick = () => setRemainingMs(Math.max(0, deadline - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return remainingMs;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = h > 0 ? [h, m, s] : [m, s];
  return parts.map((p) => String(p).padStart(2, "0")).join(":");
}

export function BankTransferDialog({
  open,
  onOpenChange,
  amount,
  bankName,
  accountNumber,
  accountName,
  paymentContent,
  expiresAt,
  status,
  errorMessage,
  successTitle = "Thanh toán thành công!",
  successDescription,
  onCheckNow,
  isCheckingNow,
  onRetryExpired,
}: BankTransferDialogProps) {
  const remainingMs = useCountdown(expiresAt);
  const isExpired = status === "pending" && remainingMs !== null && remainingMs <= 0;
  const effectiveStatus: BankTransferDialogStatus = isExpired ? "expired" : status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chuyển khoản ngân hàng</DialogTitle>
        </DialogHeader>

        {effectiveStatus === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-14 w-14 text-green-500" />
            <p className="text-lg font-semibold">{successTitle}</p>
            {successDescription && (
              <div className="text-sm text-muted-foreground">{successDescription}</div>
            )}
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </div>
        ) : effectiveStatus === "expired" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Clock className="h-14 w-14 text-amber-500" />
            <p className="text-lg font-semibold">Đã hết hạn chuyển khoản</p>
            <p className="text-sm text-muted-foreground">
              Vui lòng tạo lại giao dịch để nhận mã chuyển khoản mới.
            </p>
            <div className="flex w-full gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
              {onRetryExpired && (
                <Button className="flex-1" onClick={onRetryExpired}>
                  Tạo lại
                </Button>
              )}
            </div>
          </div>
        ) : effectiveStatus === "error" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <XCircle className="h-14 w-14 text-red-500" />
            <p className="text-lg font-semibold">Giao dịch không thành công</p>
            <p className="text-sm text-muted-foreground">
              {errorMessage || "Vui lòng liên hệ hỗ trợ nếu bạn đã chuyển khoản đúng nội dung."}
            </p>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Chuyển khoản đúng số tiền và NỘI DUNG bên dưới. Hệ thống sẽ tự động xác nhận sau khi nhận
              được giao dịch.
            </p>

            <div className="rounded-lg bg-primary-50 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">Số tiền cần chuyển</p>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(amount)}</p>
            </div>

            <div className="space-y-2">
              {bankName && <CopyRow label="Ngân hàng" value={bankName} />}
              {accountNumber && <CopyRow label="Số tài khoản" value={accountNumber} />}
              {accountName && <CopyRow label="Chủ tài khoản" value={accountName} />}
              <CopyRow label="Nội dung chuyển khoản (bắt buộc)" value={paymentContent} />
            </div>

            {(!bankName || !accountNumber) && (
              <p className="text-xs text-amber-600">
                Chưa có đầy đủ thông tin ngân hàng. Vui lòng liên hệ hỗ trợ để lấy thông tin chuyển khoản.
              </p>
            )}

            {remainingMs !== null && (
              <p className="text-center text-xs text-muted-foreground">
                Hết hạn sau <span className="font-medium">{formatCountdown(remainingMs)}</span>
              </p>
            )}

            <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang chờ xác nhận giao dịch...
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
              {onCheckNow && (
                <Button className="flex-1" onClick={onCheckNow} disabled={isCheckingNow}>
                  {isCheckingNow ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Tôi đã chuyển khoản
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
