"use client";

/**
 * Dialog chuyển khoản ngân hàng — component CHUNG dùng cho cả mua xu
 * (coins) và thanh toán đơn hàng khoá học (checkout), theo yêu cầu DRY ở
 * mục 12/13 (plans/reports/web-core-developer-260909-1412-web-logic-fixes.md).
 *
 * Component này THUẦN HIỂN THỊ — không tự gọi API. Logic polling/verify
 * khác nhau giữa coins (POST /coins/purchases/:id/verify) và order
 * (GET /orders/:id/payment-status + POST /orders/:id/check-payment) nên
 * nằm ở 2 hook riêng (`usePurchaseVerificationPolling`, `usePaymentStatus`)
 * — dialog chỉ nhận state đã tính sẵn qua props.
 */

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Copy, Loader2, XCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

/**
 * "reconciling" (review backend #76 vòng 3, chỉ đơn khoá học): server chưa có kết quả đối chiếu ngân
 * hàng cuối cùng. Không cho tạo lại / tạo đơn mới, chỉ giải thích và cho kiểm tra lại.
 */
export type BankTransferDialogStatus = "pending" | "success" | "error" | "expired" | "reconciling";

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
  isLoading?: boolean;
  successTitle?: string;
  successDescription?: React.ReactNode;
  /** Nút "Tôi đã chuyển khoản" — chỉ order có (coins không có endpoint ép check tương đương). */
  onCheckNow?: () => void;
  isCheckingNow?: boolean;
  onRetryExpired?: () => void;
  /** Chữ riêng cho màn hết hạn (đơn khoá học khác mua xu: phải tạo ĐƠN mới, không chỉ mã mới). */
  expiredTitle?: string;
  expiredDescription?: React.ReactNode;
  retryExpiredLabel?: string;
  /**
   * Đồng hồ về 0 KHÔNG tự chuyển sang màn "hết hạn": server còn đối chiếu giao dịch lần cuối (đơn
   * khoá học). Hiện "đang kiểm tra" cho tới khi `status` do server trả đổi sang expired/success.
   */
  awaitServerAfterExpiry?: boolean;
  /** Nội dung màn "reconciling". */
  reconcilingDescription?: React.ReactNode;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const handleCopy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`Đã sao chép ${label.toLowerCase()}`))
      .catch(() =>
        toast.error("Chưa sao chép được. Bạn có thể chọn và sao chép thông tin bên dưới.")
      );
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-all font-mono text-sm font-medium select-all">{value}</p>
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
  isLoading = false,
  successTitle = "Thanh toán thành công!",
  successDescription,
  onCheckNow,
  isCheckingNow,
  onRetryExpired,
  expiredTitle = "Đã hết hạn chuyển khoản",
  expiredDescription = "Vui lòng tạo lại giao dịch để nhận mã chuyển khoản mới.",
  retryExpiredLabel = "Tạo lại",
  awaitServerAfterExpiry = false,
  reconcilingDescription,
}: BankTransferDialogProps) {
  const remainingMs = useCountdown(open ? expiresAt : null);
  const countdownOver = status === "pending" && remainingMs !== null && remainingMs <= 0;
  const isExpired = countdownOver && !awaitServerAfterExpiry;
  const isFinalChecking = countdownOver && awaitServerAfterExpiry;
  const effectiveStatus: BankTransferDialogStatus = isExpired ? "expired" : status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto p-0">
        <DialogHeader className="border-b bg-slate-50/70 px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            Chuyển khoản ngân hàng
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div
            role="status"
            className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang chuẩn bị thông tin chuyển khoản…
          </div>
        ) : effectiveStatus === "success" ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
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
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <Clock className="h-14 w-14 text-amber-500" />
            <p className="text-lg font-semibold">{expiredTitle}</p>
            <p className="text-sm text-muted-foreground">{expiredDescription}</p>
            <div className="flex w-full gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
              {onRetryExpired && (
                <Button className="flex-1" onClick={onRetryExpired}>
                  {retryExpiredLabel}
                </Button>
              )}
            </div>
          </div>
        ) : effectiveStatus === "reconciling" ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <Loader2 className="h-14 w-14 animate-spin text-amber-500" />
            <p className="text-lg font-semibold">Đang đối chiếu thanh toán</p>
            {reconcilingDescription && (
              <div className="text-sm text-muted-foreground">{reconcilingDescription}</div>
            )}
            <div className="flex w-full gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Để sau
              </Button>
              {onCheckNow && (
                <Button className="flex-1" onClick={onCheckNow} disabled={isCheckingNow}>
                  {isCheckingNow ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Kiểm tra lại
                </Button>
              )}
            </div>
          </div>
        ) : effectiveStatus === "error" ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
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
          <div className="space-y-5 px-6 pb-6">
            <p className="text-sm text-muted-foreground">
              Chuyển đúng số tiền và nội dung bên dưới từ ứng dụng ngân hàng của bạn. Khoá học hoặc
              xu sẽ được cập nhật sau khi giao dịch được xác nhận.
            </p>

            <div className="rounded-lg bg-slate-50 px-4 py-5 text-center">
              <p className="text-xs text-muted-foreground">Số tiền cần chuyển</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(amount)}</p>
            </div>

            <div className="space-y-2">
              {bankName && <CopyRow label="Ngân hàng" value={bankName} />}
              {accountNumber && <CopyRow label="Số tài khoản" value={accountNumber} />}
              {accountName && <CopyRow label="Chủ tài khoản" value={accountName} />}
              <CopyRow label="Nội dung chuyển khoản (bắt buộc)" value={paymentContent} />
            </div>

            {(!bankName || !accountNumber) && (
              <p className="text-xs text-amber-600">
                Chưa cấu hình đầy đủ tài khoản nhận tiền. Vui lòng quay lại sau hoặc liên hệ hỗ trợ;
                bạn chưa cần chuyển khoản.
              </p>
            )}

            {errorMessage && (
              <p
                role="alert"
                className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800"
              >
                {errorMessage}
              </p>
            )}
            {isFinalChecking ? (
              <p className="text-center text-xs text-amber-600">
                Đã hết thời gian chuyển khoản. Hệ thống đang kiểm tra lần cuối các giao dịch đã
                nhận, vui lòng không chuyển khoản lại.
              </p>
            ) : (
              remainingMs !== null && (
                <p className="text-center text-xs text-muted-foreground">
                  Hết hạn sau <span className="font-medium">{formatCountdown(remainingMs)}</span>
                </p>
              )
            )}

            <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang chờ xác nhận giao dịch...
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Để sau
              </Button>
              {onCheckNow && (
                <Button className="flex-1" onClick={onCheckNow} disabled={isCheckingNow}>
                  {isCheckingNow ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
