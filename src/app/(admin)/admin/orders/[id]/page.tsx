"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAdminOrder, useRefundOrder } from "@/hooks/queries/use-admin-orders";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { QueryState } from "@/components/common/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import type { RefundMethod } from "@/services/admin-order.service";
import { ORDER_STATUS_LABEL, formatOrderDateTime } from "@/services/order.service";
import { LateRefundDialog } from "./_components/late-refund-dialog";

const REASON_MAX_LEN = 500;
const TRANSACTION_REF_MAX_LEN = 100;

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");

  const { data: order, isLoading, isError, error, refetch } = useAdminOrder(id);
  const refundMutation = useRefundOrder();

  const [refundOpen, setRefundOpen] = useState(false);
  const [reason, setReason] = useState("");
  // B6 (QA vòng 2 N-13): quyết định #1 yêu cầu "kèm mã giao dịch" để đối soát sao kê.
  const [transactionRef, setTransactionRef] = useState("");
  // Chỉ 1 hình thức hợp lệ (quyết định #1: chuyển khoản thủ công, KHÔNG ví xu) — không cần state
  // chọn, hằng số REFUND_METHOD dưới đây là giá trị DUY NHẤT backend chấp nhận.
  const REFUND_METHOD: RefundMethod = "manual_bank_transfer";

  const closeDialog = () => {
    setRefundOpen(false);
    setReason("");
    setTransactionRef("");
  };

  const canSubmit =
    reason.trim().length > 0 &&
    reason.length <= REASON_MAX_LEN &&
    transactionRef.trim().length > 0 &&
    transactionRef.length <= TRANSACTION_REF_MAX_LEN;

  const onConfirmRefund = () => {
    if (!canSubmit) return;
    refundMutation.mutate(
      {
        id,
        dto: { reason: reason.trim(), refund_method: REFUND_METHOD, transaction_ref: transactionRef.trim() },
      },
      { onSuccess: closeDialog }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chi tiết đơn hàng</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{order?.order_number ?? id}</p>
        </div>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        {order && (
          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            {/* Danh sách khóa học trong đơn */}
            <section className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <h2 className="mb-3 text-base font-semibold">Khóa học trong đơn</h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{item.course_name || "Khóa học không còn tồn tại"}</span>
                    <span className="font-medium">{formatCurrency(item.final_price)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm font-semibold dark:border-gray-800">
                <span>Tổng tiền</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </section>

            {/* Thông tin đơn + hành động hoàn tiền */}
            <section className="space-y-4">
              <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <h2 className="mb-3 text-base font-semibold">Thông tin đơn</h2>
                <div className="space-y-2 text-sm">
                  <Row
                    label="Trạng thái"
                    value={
                      <span className="inline-flex flex-wrap justify-end gap-1">
                        <Badge>{ORDER_STATUS_LABEL[order.status] ?? order.status}</Badge>
                        {/* Tiền về cho đơn đã huỷ/hết hạn: không khôi phục, hoàn tiền tay (review #76 final). */}
                        {order.refund_needed && <Badge variant="destructive">Cần hoàn tiền</Badge>}
                        {/* Admin đã ghi nhận chuyển khoản hoàn: cờ tắt, badge đổi thành "Đã hoàn tiền". */}
                        {!order.refund_needed && order.late_refunded_at && <Badge variant="success">Đã hoàn tiền</Badge>}
                      </span>
                    }
                  />
                  <Row label="Phương thức" value={PAYMENT_METHOD_LABEL[order.payment_method ?? ""] ?? order.payment_method ?? "-"} />
                  <Row label="Ngày tạo" value={formatOrderDateTime(order.created_at)} />
                  {order.paid_at && <Row label="Ngày thanh toán" value={formatOrderDateTime(order.paid_at)} />}
                  {order.notes && <Row label="Ghi chú" value={order.notes} />}
                  {order.refunded_at && <Row label="Ngày hoàn tiền" value={formatOrderDateTime(order.refunded_at)} />}
                  {order.late_refunded_at && (
                    <Row label="Đã hoàn khoản tiền về muộn" value={formatOrderDateTime(order.late_refunded_at)} />
                  )}
                  {order.refund_transaction_ref && <Row label="Mã giao dịch hoàn" value={order.refund_transaction_ref} />}
                  {order.refund_reason && <Row label="Lý do hoàn" value={order.refund_reason} />}
                </div>
              </div>

              {/* Nút "Hoàn tiền" — chỉ hiện khi đơn đã completed (quyết định #1: hoàn tiền =
                  admin xác nhận đã chuyển khoản tay, không hoàn ví xu) + có quyền PAYMENTS_MANAGE. */}
              {order.status === "completed" && (
                <Can permission={PERMISSIONS.MANAGE_PAYMENTS}>
                  <Button variant="destructive" className="w-full" onClick={() => setRefundOpen(true)}>
                    Hoàn tiền
                  </Button>
                </Can>
              )}

              {/* Đơn đã huỷ/hết hạn nhận tiền về muộn: sau khi admin chuyển khoản hoàn, ghi nhận ở đây. */}
              {order.refund_needed && (
                <Can permission={PERMISSIONS.MANAGE_PAYMENTS}>
                  <LateRefundDialog
                    orderId={order.id}
                    orderNumber={order.order_number}
                    totalAmount={Number(order.total_amount)}
                  />
                </Can>
              )}
            </section>
          </div>
        )}
      </QueryState>

      {/* Dialog hoàn tiền — bắt nhập lý do, chọn phương thức, hiển thị rõ số tiền TRƯỚC khi
          xác nhận (tiền thật, không hoàn tác được sau khi bấm — xem phase-02 "Rủi ro"). */}
      <Dialog open={refundOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogTitle>Xác nhận hoàn tiền</DialogTitle>
          <DialogDescription>
            Đơn <strong>{order?.order_number}</strong> — số tiền hoàn:{" "}
            <strong>{order ? formatCurrency(order.total_amount) : ""}</strong>. Hành động này{" "}
            <strong>không thể hoàn tác</strong>. Chỉ bấm xác nhận SAU KHI đã thực sự chuyển
            khoản cho học viên.
          </DialogDescription>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <label className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
                Lý do hoàn tiền <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={REASON_MAX_LEN}
                rows={3}
                placeholder="VD: Học viên khiếu nại nội dung sai, đã xác minh và đồng ý hoàn tiền."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {reason.length}/{REASON_MAX_LEN}
              </p>
            </div>

            <div>
              <label htmlFor="refund-transaction-ref" className="mb-1 block font-medium text-gray-700 dark:text-gray-300">
                Mã giao dịch chuyển khoản <span className="text-red-500">*</span>
              </label>
              <input
                id="refund-transaction-ref"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                maxLength={TRANSACTION_REF_MAX_LEN}
                placeholder="VD: FT26271123456789 (mã trên sao kê ngân hàng)"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>

            <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-400">
              Hình thức hoàn tiền: <strong>chuyển khoản thủ công</strong> — bạn tự chuyển khoản cho
              học viên NGOÀI hệ thống trước, sau đó bấm xác nhận bên dưới để ghi nhận đã hoàn.
              Hệ thống hiện chưa hỗ trợ hoàn vào ví xu (quyết định chủ dự án 27/09/2026).
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={!canSubmit}
              isLoading={refundMutation.isPending}
              onClick={onConfirmRefund}
            >
              Xác nhận đã hoàn tiền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Chuyển khoản ngân hàng",
  qr_transfer: "Chuyển khoản QR",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}
