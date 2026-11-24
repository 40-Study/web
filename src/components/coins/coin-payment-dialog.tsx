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
import { isPaymentProviderUnavailableError } from "@/hooks/queries/use-orders";

interface CoinPaymentDialogProps {
  purchase: CoinPurchase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Câu dự phòng khi kiểm tra giao dịch lỗi. Không giả định học viên đã chuyển khoản ("đừng chuyển lần nữa"
 * sai với người chưa chuyển).
 */
export const COIN_VERIFY_FAILED_MESSAGE =
  "Chưa kiểm tra được giao dịch. Nếu bạn đã chuyển khoản, đừng chuyển lại: xu sẽ được cộng khi hệ thống kiểm tra được.";

/**
 * Contract 7: verify trả 503 `ERR_PAYMENT_PROVIDER_UNAVAILABLE` cả khi dịch vụ ngân hàng không trả lời lẫn khi
 * chưa cấu hình. Câu bình tĩnh, đúng cho cả hai trường hợp, không bao giờ in lỗi kỹ thuật.
 */
export const COIN_PROVIDER_UNAVAILABLE_MESSAGE =
  "Hệ thống chưa kiểm tra được giao dịch với ngân hàng lúc này. Vui lòng thử lại sau ít phút; nếu bạn đã chuyển khoản, đừng chuyển lại.";

function coinVerifyErrorMessage(error: unknown): string {
  if (isPaymentProviderUnavailableError(error)) return COIN_PROVIDER_UNAVAILABLE_MESSAGE;
  return getErrorMessage(error, COIN_VERIFY_FAILED_MESSAGE);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function CoinPaymentDialog({ purchase, open, onOpenChange }: CoinPaymentDialogProps) {
  const [pollingEnabled, setPollingEnabled] = useState(true);
  // Contract 7: KHÔNG tự gọi verify ngay sau khi tạo đơn nạp. Chỉ kiểm tra (rồi poll) sau khi học viên
  // bấm "Tôi đã chuyển khoản" trong lần mở hộp này.
  const [transferReported, setTransferReported] = useState(false);

  // H-03: component không unmount giữa 2 lần mua (coins/page.tsx luôn render,
  // `if (!purchase) return null` nằm sau hook) — nếu không reset theo
  // `purchase.id`, đóng dialog 1 lần là `pollingEnabled=false` vĩnh viễn,
  // lần mua thứ 2 trở đi không poll xác nhận, dialog treo ở "Đang chờ...".
  useEffect(() => {
    setPollingEnabled(true);
    setTransferReported(false);
  }, [purchase?.id]);

  // Chưa có tài khoản nhận tiền thì học viên chưa thể chuyển khoản: không gọi verify (gọi chỉ ra lỗi
  // ngân hàng, kèm câu "đừng chuyển lần nữa" trái với cảnh báo "chưa cần chuyển khoản", QA4 S7).
  const bankConfigured = Boolean(
    purchase?.bank_transfer_info?.bank_name && purchase?.bank_transfer_info?.account_number
  );

  const {
    data: polled,
    error: pollError,
    refetch,
    isFetching,
  } = usePurchaseVerificationPolling(
    purchase?.id ?? "",
    open && pollingEnabled && bankConfigured && transferReported
  );

  if (!purchase) return null;

  const status = polled?.status ?? purchase.status;
  const dialogStatus: BankTransferDialogStatus =
    status === "COMPLETED"
      ? "success"
      : status === "FAILED" || status === "REFUNDED"
        ? "error"
        : "pending";
  const errorMessage = pollError ? coinVerifyErrorMessage(pollError) : undefined;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPollingEnabled(false);
      setTransferReported(false);
    }
    onOpenChange(next);
  };

  // Lần bấm đầu bật kiểm tra (query tự chạy rồi poll); các lần sau kiểm tra lại ngay.
  const handleCheckNow = () => {
    setPollingEnabled(true);
    if (!transferReported) setTransferReported(true);
    else void refetch({ cancelRefetch: false });
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
      onCheckNow={handleCheckNow}
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
