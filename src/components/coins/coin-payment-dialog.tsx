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

  const {
    data: polled,
    error: pollError,
    refetch,
    isFetching,
  } = usePurchaseVerificationPolling(purchase?.id ?? "", open && pollingEnabled);

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
        "Chưa thể kiểm tra thanh toán. Bạn có thể thử lại; vui lòng không chuyển khoản lần nữa."
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
