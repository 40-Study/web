"use client";

import { useState } from "react";
import { useMarkLateRefunded } from "@/hooks/queries/use-admin-orders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

const NOTE_MAX_LEN = 500;
const TRANSACTION_REF_MAX_LEN = 100;

interface LateRefundDialogProps {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
}

/**
 * Nút + hộp xác nhận "Đánh dấu đã hoàn tiền" cho đơn đã huỷ/hết hạn có tiền về muộn (cờ refund_needed).
 * Chỉ ghi nhận việc admin ĐÃ chuyển khoản hoàn NGOÀI hệ thống; không đổi trạng thái đơn. Ghi chú và mã
 * giao dịch đều tuỳ chọn (khác hoàn tiền đơn đã thanh toán, nơi mã giao dịch là bắt buộc).
 */
export function LateRefundDialog({ orderId, orderNumber, totalAmount }: LateRefundDialogProps) {
  const mutation = useMarkLateRefunded();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [transactionRef, setTransactionRef] = useState("");

  const close = () => {
    setOpen(false);
    setNote("");
    setTransactionRef("");
  };

  const confirm = () => {
    mutation.mutate(
      { id: orderId, dto: { note: note.trim(), transaction_ref: transactionRef.trim() } },
      { onSuccess: close }
    );
  };

  return (
    <>
      <Button className="w-full" onClick={() => setOpen(true)}>
        Đánh dấu đã hoàn tiền
      </Button>

      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent>
          <DialogTitle>Xác nhận đã hoàn tiền</DialogTitle>
          <DialogDescription>
            Đơn <strong>{orderNumber}</strong> đã nhận khoản tiền {formatCurrency(totalAmount)} sau khi
            đơn đóng. Chỉ bấm xác nhận <strong>SAU KHI</strong> bạn đã thực sự chuyển khoản hoàn lại
            cho học viên. Đơn vẫn giữ nguyên trạng thái, hệ thống chỉ ghi nhận đã hoàn.
          </DialogDescription>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <label htmlFor="late-refund-ref" className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
                Mã giao dịch hoàn (không bắt buộc)
              </label>
              <input
                id="late-refund-ref"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                maxLength={TRANSACTION_REF_MAX_LEN}
                placeholder="VD: FT26271123456789 (mã trên sao kê ngân hàng)"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <div>
              <label htmlFor="late-refund-note" className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
                Ghi chú (không bắt buộc)
              </label>
              <textarea
                id="late-refund-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={NOTE_MAX_LEN}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {note.length}/{NOTE_MAX_LEN}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Hủy
            </Button>
            <Button isLoading={mutation.isPending} onClick={confirm}>
              Xác nhận đã hoàn tiền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
