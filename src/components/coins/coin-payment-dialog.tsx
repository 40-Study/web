"use client";

/** Bank details come from the backend for both course orders and coin purchases. */

import { useEffect, useState } from "react";
import { usePurchaseVerificationPolling } from "@/hooks/queries/use-coins";
import type { CoinPurchase } from "@/services/coin.service";
import {
  BankTransferDialog,
  type BankTransferDialogStatus,
} from "@/components/payment/bank-transfer-dialog";
import { getErrorMessage } from "@/lib/error-messages";

interface CoinPaymentDialogProps {
  purchase: CoinPurchase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Câu dự phòng khi kiểm tra giao dịch lỗi. Không giả định học viên đã chuyển khoản ("đừng chuyển lần nữa"
 * sai với người chưa chuyển). Lỗi ngân hàng 503 `ERR_PAYMENT_PROVIDER_UNAVAILABLE` có câu riêng trong
 * contract-error-codes.ts qua getErrorMessage.
 */
export const COIN_VERIFY_FAILED_MESSAGE =
  "Chưa kiểm tra được giao dịch. Nếu bạn đã chuyển khoản, đừng chuyển lại: xu sẽ được cộng khi hệ thống kiểm tra được.";

function formatNumber(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function CoinPaymentDialog({ purchase, open, onOpenChange }: CoinPaymentDialogProps) {
  const [pollingEnabled, setPollingEnabled] = useState(true);

  // H-03: component không unmount giữa 2 lần mua (coins/page.tsx luôn render,
  // `if (!purchase) return null` nằm sau hook) — nếu không reset theo
  // `purchase.id`, đóng dialog 1 lần là `pollingEnabled=false` vĩnh viễn,
  // lần mua thứ 2 trở đi không poll xác nhận, dialog treo ở "Đang chờ...".
  useEffect(() => {
    setPollingEnabled(true);
  }, [purchase?.id]);

  // Chưa có tài khoản nhận tiền thì học viên chưa thể chuyển khoản: không tự gọi verify (gọi chỉ ra lỗi
  // ngân hàng, kèm câu "đừng chuyển lần nữa" trái với cảnh báo "chưa cần chuyển khoản", QA4 S7).
  const bankConfigured = Boolean(
    purchase?.bank_transfer_info?.bank_name && purchase?.bank_transfer_info?.account_number
  );

  const {
    data: polled,
    error: pollError,
    refetch,
    isFetching,
  } = usePurchaseVerificationPolling(purchase?.id ?? "", open && pollingEnabled && bankConfigured);

  if (!purchase) return null;

  const status = polled?.status ?? purchase.status;
  const dialogStatus: BankTransferDialogStatus =
    status === "COMPLETED"
      ? "success"
      : status === "FAILED" || status === "REFUNDED"
        ? "error"
        : "pending";
  const errorMessage = pollError
    ? getErrorMessage(
        pollError,
        COIN_VERIFY_FAILED_MESSAGE
      )
    : undefined;

  const handleOpenChange = (next: boolean) => {
    if (!next) setPollingEnabled(false);
    onOpenChange(next);
  };

  return (
    <BankTransferDialog
      open={open}
      onOpenChange={handleOpenChange}
      amount={purchase.price}
      bankName={purchase.bank_transfer_info?.bank_name}
      accountNumber={purchase.bank_transfer_info?.account_number}
      accountName={purchase.bank_transfer_info?.account_name}
      paymentContent={
        purchase.bank_transfer_info?.content ?? `40STUDY ${purchase.payment_reference ?? ""}`.trim()
      }
      onCheckNow={() => void refetch({ cancelRefetch: false })}
      isCheckingNow={isFetching}
      status={dialogStatus}
      errorMessage={errorMessage}
      successTitle="Thanh toán thành công!"
      successDescription={
        <>
          {formatNumber(purchase.coin_amount + purchase.bonus_amount)} xu đã được cộng vào ví của
          bạn.
        </>
      }
    />
  );
}
