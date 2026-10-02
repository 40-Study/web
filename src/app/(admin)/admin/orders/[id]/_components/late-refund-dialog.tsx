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
import { formatLateRefundAmount } from "@/lib/late-refund";
import type { LateRefundItem } from "@/services/order.service";

const NOTE_MAX_LEN = 500;
const TRANSACTION_REF_MAX_LEN = 100;

interface LateRefundDialogProps {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  /**
   * Các khoản còn chờ hoàn (L6). Admin chọn khoản vừa chuyển khoản hoàn; chỉ khoản được chọn bị tắt cờ.
   * Rỗng/không truyền (backend cũ) thì xác nhận cho cả đơn như trước.
   */
  pendingItems?: LateRefundItem[];
}

/**
 * Nút + hộp xác nhận "Đánh dấu đã hoàn tiền" cho đơn có tiền về muộn (cờ refund_needed): đơn đã huỷ/hết
 * hạn, hoặc đơn đã hoàn tất nhận chuyển dư. Chỉ ghi nhận việc admin ĐÃ chuyển khoản hoàn NGOÀI hệ
 * thống; không đổi trạng thái đơn. Ghi chú và mã giao dịch đều tuỳ chọn (khác hoàn tiền đơn đã thanh
 * toán, nơi mã giao dịch là bắt buộc).
 */
export function LateRefundDialog({ orderId, orderNumber, totalAmount, pendingItems = [] }: LateRefundDialogProps) {
  const mutation = useMarkLateRefunded();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  // Mặc định chọn TẤT CẢ khoản đang chờ; lưu phần bỏ chọn để danh sách đổi sau khi refetch vẫn đúng.
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set());

  const hasItems = pendingItems.length > 0;
  const selectedRefs = pendingItems.filter((i) => !unchecked.has(i.ref)).map((i) => i.ref);
  const canConfirm = !hasItems || selectedRefs.length > 0;

  const close = () => {
    setOpen(false);
    setNote("");
    setTransactionRef("");
    setUnchecked(new Set());
  };

  const toggle = (ref: string) =>
    setUnchecked((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });

  const confirm = () => {
    if (!canConfirm) return;
    mutation.mutate(
      {
        id: orderId,
        dto: {
          note: note.trim(),
          transaction_ref: transactionRef.trim(),
          // Có danh sách khoản thì gửi tường minh khoản đã chọn; không thì backend hoàn mọi khoản chờ.
          ...(hasItems && { refs: selectedRefs }),
        },
      },
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
            {hasItems ? (
              <>
                Đơn <strong>{orderNumber}</strong> có {pendingItems.length} khoản tiền về muộn chưa hoàn. Chọn
                khoản bạn đã chuyển khoản hoàn lại cho học viên; khoản không chọn vẫn được giữ là cần hoàn.
              </>
            ) : (
              <>
                Đơn <strong>{orderNumber}</strong> đã nhận khoản tiền {formatCurrency(totalAmount)} sau khi
                đơn đóng.
              </>
            )}{" "}
            Chỉ bấm xác nhận <strong>SAU KHI</strong> bạn đã thực sự chuyển khoản hoàn lại cho học viên. Đơn
            vẫn giữ nguyên trạng thái, hệ thống chỉ ghi nhận đã hoàn.
          </DialogDescription>

          {hasItems && (
            <fieldset className="mt-4 space-y-2 text-sm">
              <legend className="mb-1 font-medium text-gray-700 dark:text-gray-300">Khoản đã hoàn</legend>
              {pendingItems.map((item) => (
                <label
                  key={item.ref}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={!unchecked.has(item.ref)}
                    onChange={() => toggle(item.ref)}
                    aria-label={`Khoản ${item.transaction_id || item.ref}`}
                  />
                  <span className="font-mono text-xs">{item.transaction_id || "(không có mã giao dịch)"}</span>
                  <span className="ml-auto font-medium">{formatLateRefundAmount(item.amount)}</span>
                </label>
              ))}
            </fieldset>
          )}

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
            <Button isLoading={mutation.isPending} disabled={!canConfirm} onClick={confirm}>
              Xác nhận đã hoàn tiền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}