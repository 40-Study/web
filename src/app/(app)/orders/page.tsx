"use client";

/**
 * "Đơn hàng của tôi" (B3, QA vòng 2 N1). Trước đây không có trang nào liệt kê đơn: đóng hộp
 * thanh toán là mất đường quay lại đơn đang chờ chuyển khoản, cũng không hủy được.
 * Đơn còn mở (pending/processing, chưa quá hạn) có 2 hành động:
 * - "Tiếp tục thanh toán": mở lại OrderPaymentDialog. Backend trả lại ĐÚNG mã chuyển khoản cũ nếu
 *   đơn đã "processing" và mã còn hạn, hoặc tạo phiên mới nếu đơn còn "pending".
 * - "Hủy đơn": xác nhận rồi POST /orders/:id/cancel.
 * Đơn hết hạn (backend trả 409 ERR_ORDER_EXPIRED khi mở thanh toán, hoặc đã "expired"): "Tạo đơn
 * mới" gọi POST /orders (buy_now) cho đúng các khóa của đơn đó, giá tính lại theo hiện tại, rồi mở
 * hộp thanh toán cho đơn mới.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { QueryState } from "@/components/common/query-state";
import { OrderPaymentDialog } from "@/components/checkout/order-payment-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useCancelOrder, useCreateOrder, useMyOrders } from "@/hooks/queries/use-orders";
import { ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/services/order.service";
import { MyOrderCard } from "./_components/my-order-card";

const PAGE_SIZE = 10;
const STATUS_FILTERS: OrderStatus[] = ["pending", "processing", "completed", "cancelled", "refunded", "expired"];

export default function MyOrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const { data, isLoading, isError, error, refetch } = useMyOrders({
    page,
    limit: PAGE_SIZE,
    status: status || undefined,
  });
  const cancelMutation = useCancelOrder();
  const createOrderMutation = useCreateOrder();

  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const orders = data?.orders ?? [];

  const closePayment = () => {
    setPayingOrder(null);
    // Mở phiên thanh toán chuyển đơn pending -> processing: tải lại để trạng thái/hạn hiện đúng.
    refetch();
  };

  // Lỗi (409 đơn đang mở, đã ghi danh...) đã được useCreateOrder toast sẵn.
  const reorder = (order: Order) => {
    setReorderingId(order.id);
    createOrderMutation.mutate(
      { source: "buy_now", course_ids: order.items.map((item) => item.course_id), idempotency_key: uuidv4() },
      {
        onSuccess: (created) => {
          refetch();
          if (created.status === "completed") {
            // Khóa đã chuyển miễn phí: backend hoàn tất đơn 0đ và ghi danh ngay.
            toast.success("Đã ghi danh khóa học");
            return;
          }
          setPayingOrder(created);
        },
        onSettled: () => setReorderingId(null),
      }
    );
  };

  const retryExpiredPayment = () => {
    const expired = payingOrder;
    setPayingOrder(null);
    if (expired) reorder(expired);
  };

  const confirmCancel = () => {
    if (!cancellingOrder) return;
    cancelMutation.mutate(cancellingOrder.id, { onSettled: () => setCancellingOrder(null) });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Đơn hàng của tôi</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tiếp tục thanh toán hoặc hủy các đơn đang chờ. Cần hoàn tiền? Vui lòng liên hệ bộ phận hỗ trợ.
        </p>
      </div>

      <select
        aria-label="Lọc theo trạng thái"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value as OrderStatus | "");
          setPage(1);
        }}
        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm sm:w-64 dark:border-gray-700 dark:bg-gray-900"
      >
        <option value="">Tất cả trạng thái</option>
        {STATUS_FILTERS.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABEL[s]}
          </option>
        ))}
      </select>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && orders.length === 0}
        emptyTitle="Chưa có đơn hàng nào"
        emptyDescription={status ? "Không có đơn nào ở trạng thái này." : "Các đơn mua khóa học của bạn sẽ hiện ở đây."}
      >
        <div className="space-y-4">
          {orders.map((order) => (
            <MyOrderCard
              key={order.id}
              order={order}
              onPay={setPayingOrder}
              onCancel={setCancellingOrder}
              onReorder={reorder}
              isReordering={reorderingId === order.id}
            />
          ))}
        </div>

        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Trang {data.page}/{data.total_pages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Trước
              </Button>
              <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}>
                Sau
              </Button>
            </div>
          </div>
        )}
      </QueryState>

      <OrderPaymentDialog
        orderId={payingOrder?.id ?? null}
        amount={payingOrder ? Number(payingOrder.total_amount) : 0}
        open={!!payingOrder}
        onOpenChange={(next) => {
          if (!next) closePayment();
        }}
        onPaid={() => {
          const paidId = payingOrder?.id;
          setPayingOrder(null);
          toast.success("Thanh toán thành công!");
          if (paidId) router.push(`/checkout/success?order_id=${paidId}`);
        }}
        onRetryExpired={retryExpiredPayment}
      />

      <Dialog open={!!cancellingOrder} onOpenChange={(next) => !next && setCancellingOrder(null)}>
        <DialogContent>
          <DialogTitle>Hủy đơn hàng?</DialogTitle>
          <DialogDescription>
            Đơn <strong>{cancellingOrder?.order_number}</strong> sẽ bị hủy. Nếu bạn đã chuyển khoản cho đơn này,
            đừng hủy mà hãy liên hệ hỗ trợ.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancellingOrder(null)}>
              Giữ đơn
            </Button>
            <Button variant="destructive" isLoading={cancelMutation.isPending} onClick={confirmCancel}>
              Hủy đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
