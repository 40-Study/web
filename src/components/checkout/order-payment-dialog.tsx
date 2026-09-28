"use client";

/**
 * Nối luồng thanh toán đơn hàng khóa học (mục 13,
 * plans/reports/web-core-developer-260909-1412-web-logic-fixes.md).
 *
 * Trước đây `POST /orders` tạo xong là hết — không có cách nào trả tiền,
 * order kẹt ở status "pending" mãi mãi. Flow đúng theo backend
 * (internal/service/payment_service.go):
 * 1. POST /orders/:id/payment-intent (payment_method="bank_transfer") — CHỈ
 *    gọi được 1 lần khi order còn "pending" (backend chuyển sang
 *    "processing" ngay khi tạo intent, gọi lần 2 lỗi "invalid state
 *    transition") → trả bank_transfer_info + payment_code + expired_at.
 * 2. Poll GET /orders/:id/payment-status mỗi 5s tới khi "completed" hoặc
 *    quá expired_at (usePaymentStatus, đã có logic dừng đúng chỗ).
 * 3. Nút "Tôi đã chuyển khoản" → POST /orders/:id/check-payment (ép kiểm
 *    tra ngay, dùng cùng useCheckPayment).
 * 4. Khi "completed", backend đã tự tạo enrollment — gọi onPaid() để
 *    checkout/page.tsx dọn giỏ hàng + chuyển sang success.
 */

import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  isOrderExpiredError,
  useCreatePaymentIntent,
  useCheckPayment,
  usePaymentStatus,
} from "@/hooks/queries/use-orders";
import type { PaymentIntent } from "@/services/order.service";
import { BankTransferDialog, type BankTransferDialogStatus } from "@/components/payment/bank-transfer-dialog";

interface OrderPaymentDialogProps {
  orderId: string | null;
  amount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid: () => void;
  /**
   * Backend KHÔNG cho gọi lại payment-intent trên order đã "processing"
   * (invalid state transition) — nên "tạo lại" khi hết hạn nghĩa là HỦY
   * order cũ + TẠO ĐƠN MỚI, việc này cần context giỏ hàng chỉ checkout/
   * page.tsx có. Truyền handler từ ngoài vào thay vì tự làm ở đây.
   */
  onRetryExpired: () => void;
}

export function OrderPaymentDialog({
  orderId,
  amount,
  open,
  onOpenChange,
  onPaid,
  onRetryExpired,
}: OrderPaymentDialogProps) {
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  // Lỗi tạo payment-intent (vd đơn đã "processing") → hiện trạng thái lỗi
  // và mở khóa ref để đóng/mở lại dialog có thể thử lại.
  const [intentError, setIntentError] = useState(false);
  // Backend từ chối vì đơn quá hạn giữ (409 ERR_ORDER_EXPIRED): lưu câu tiếng Việt của backend để
  // hiện ở màn "hết hạn" kèm nút tạo đơn mới, thay vì màn lỗi chung "Giao dịch không thành công".
  const [expiredMessage, setExpiredMessage] = useState<string | null>(null);
  const requestedForOrderId = useRef<string | null>(null);

  const createIntent = useCreatePaymentIntent();
  const checkPayment = useCheckPayment();

  // Gọi payment-intent đúng 1 lần cho mỗi order (backend không cho gọi lại
  // khi order đã "processing").
  useEffect(() => {
    if (!open || !orderId) return;
    if (requestedForOrderId.current === orderId) return;
    requestedForOrderId.current = orderId;
    // Đổi sang đơn khác (vd "Tạo đơn mới" sau khi đơn cũ hết hạn) mà dialog không đóng qua
    // handleOpenChange: xoá trạng thái của đơn cũ, nếu không màn "hết hạn" cũ vẫn hiện cho đơn mới.
    setIntent(null);
    setIntentError(false);
    setExpiredMessage(null);

    createIntent.mutate(
      { id: orderId, data: { payment_method: "bank_transfer", idempotency_key: uuidv4() } },
      {
        onSuccess: (result) => {
          setIntentError(false);
          setIntent(result);
        },
        onError: (error) => {
          if (isOrderExpiredError(error)) {
            setExpiredMessage(error.message);
            return;
          }
          setIntentError(true);
          requestedForOrderId.current = null;
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId]);

  const { data: polled } = usePaymentStatus(orderId ?? "", open && !!intent, intent?.expired_at);

  const status = polled?.status;
  const isCompleted = status === "completed" || status === "paid";

  useEffect(() => {
    if (isCompleted) onPaid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setIntent(null);
      setIntentError(false);
      setExpiredMessage(null);
      requestedForOrderId.current = null;
    }
    onOpenChange(next);
  };

  // Poll ra "expired" (backend chốt đơn hết hạn) cũng là màn hết hạn, không phải "đang chờ".
  const isOrderExpired = expiredMessage !== null || status === "expired";
  // Re-review #76 vòng 2: backend đã nhận tiền cho mã này nhưng SAU hạn → không mời "Tạo đơn mới"
  // (dễ trả lần 2); báo bộ phận hỗ trợ sẽ hoàn tiền.
  const latePaymentReceived = status === "expired" && polled?.late_payment_received === true;
  const dialogStatus: BankTransferDialogStatus = isCompleted
    ? "success"
    : isOrderExpired
      ? "expired"
      : intentError || status === "cancelled" || status === "refunded"
        ? "error"
        : "pending";

  if (!orderId) return null;

  return (
    <BankTransferDialog
      open={open}
      onOpenChange={handleOpenChange}
      amount={intent?.amount ?? amount}
      bankName={intent?.bank_transfer_info?.bank_name}
      accountNumber={intent?.bank_transfer_info?.account_number}
      accountName={intent?.bank_transfer_info?.account_name}
      paymentContent={intent?.bank_transfer_info?.content ?? intent?.payment_code ?? ""}
      expiresAt={intent?.expired_at}
      status={dialogStatus}
      successTitle="Thanh toán thành công!"
      successDescription={<>Khóa học đã được thêm vào tài khoản của bạn.</>}
      onCheckNow={orderId ? () => checkPayment.mutate(orderId) : undefined}
      isCheckingNow={checkPayment.isPending}
      onRetryExpired={latePaymentReceived ? undefined : onRetryExpired}
      expiredTitle={latePaymentReceived ? "Đã nhận tiền sau khi đơn hết hạn" : "Đơn hàng đã hết hạn"}
      expiredDescription={
        latePaymentReceived
          ? "Hệ thống đã nhận khoản chuyển của bạn nhưng sau thời hạn thanh toán. Bộ phận hỗ trợ sẽ liên hệ hoàn tiền, vui lòng không chuyển khoản lại."
          : expiredMessage ?? "Đơn đã hết hạn giữ chỗ. Tạo đơn mới để thanh toán theo giá hiện tại."
      }
      retryExpiredLabel="Tạo đơn mới"
      // Hết giờ trên đồng hồ chưa phải hết hạn thật: chờ server đối chiếu giao dịch lần cuối.
      awaitServerAfterExpiry
    />
  );
}
