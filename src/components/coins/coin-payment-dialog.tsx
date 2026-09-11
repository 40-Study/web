"use client";

/**
 * Adapter mỏng cho mua xu — logic hiển thị dùng chung `BankTransferDialog`
 * (mục 13, DRY với checkout). Chỉ còn phần polling status riêng của coins
 * (POST /coins/purchases/:id/verify — không giống payment-status của order).
 *
 * Backend KHÔNG có endpoint trả bank name/account cho mua xu (chỉ đơn hàng
 * khóa học có qua /orders/:id/payment-intent) — dùng NEXT_PUBLIC_BANK_*
 * (thông tin công khai, không phải secret; PHẢI khớp giá trị MB_BANK_NAME
 * thật phía backend).
 */

import { useEffect, useState } from "react";
import { usePurchaseVerificationPolling } from "@/hooks/queries/use-coins";
import type { CoinPurchase } from "@/services/coin.service";
import { BankTransferDialog, type BankTransferDialogStatus } from "@/components/payment/bank-transfer-dialog";
import { ApiError } from "@/lib/errors";

const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || "";
const BANK_ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "";
const BANK_ACCOUNT_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "";

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

  const { data: polled, error: pollError } = usePurchaseVerificationPolling(
    purchase?.id ?? "",
    open && pollingEnabled
  );

  if (!purchase) return null;

  const status = polled?.status ?? purchase.status;
  const dialogStatus: BankTransferDialogStatus = pollError
    ? "error"
    : status === "COMPLETED"
    ? "success"
    : status === "FAILED" || status === "REFUNDED"
    ? "error"
    : "pending";
  const errorMessage =
    pollError instanceof ApiError && pollError.message ? pollError.message : undefined;

  const handleOpenChange = (next: boolean) => {
    if (!next) setPollingEnabled(false);
    onOpenChange(next);
  };

  return (
    <BankTransferDialog
      open={open}
      onOpenChange={handleOpenChange}
      amount={purchase.price}
      bankName={BANK_NAME}
      accountNumber={BANK_ACCOUNT_NUMBER}
      accountName={BANK_ACCOUNT_NAME}
      paymentContent={`40STUDY ${purchase.payment_reference ?? ""}`.trim()}
      status={dialogStatus}
      errorMessage={errorMessage}
      successTitle="Thanh toán thành công!"
      successDescription={
        <>{formatNumber(purchase.coin_amount + purchase.bonus_amount)} xu đã được cộng vào ví của bạn.</>
      }
    />
  );
}
