"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  ORDER_STATUS_LABEL,
  formatOrderDateTime,
  isOrderOpen,
  type Order,
  type OrderStatus,
} from "@/services/order.service";

const STATUS_VARIANT: Record<OrderStatus, "success" | "warning" | "destructive" | "outline" | "secondary"> = {
  pending: "warning",
  processing: "warning",
  completed: "success",
  cancelled: "secondary",
  refunded: "destructive",
  expired: "outline",
};

interface MyOrderCardProps {
  order: Order;
  onPay: (order: Order) => void;
  onCancel: (order: Order) => void;
  /** Đơn hết hạn: tạo đơn mới cho đúng các khóa này theo giá hiện tại. */
  onReorder: (order: Order) => void;
  isReordering?: boolean;
}

/** Một đơn trong "Đơn hàng của tôi": khóa học, tổng tiền, ngày tạo, hạn giữ đơn và hành động. */
export function MyOrderCard({ order, onPay, onCancel, onReorder, isReordering }: MyOrderCardProps) {
  const open = isOrderOpen(order);
  // Đơn pending/processing đã quá hạn nhưng backend chưa kịp quét sang "expired": hiện đúng là
  // hết hạn thay vì cho bấm thanh toán rồi nhận lỗi.
  const heldButExpired = !open && (order.status === "pending" || order.status === "processing");
  const isExpired = heldButExpired || order.status === "expired";
  const statusLabel = heldButExpired ? ORDER_STATUS_LABEL.expired : ORDER_STATUS_LABEL[order.status];
  const variant = heldButExpired ? STATUS_VARIANT.expired : STATUS_VARIANT[order.status];

  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">Mã đơn</p>
          <p className="break-all font-medium text-gray-900 dark:text-gray-100">{order.order_number}</p>
        </div>
        <Badge variant={variant}>{statusLabel}</Badge>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3">
            <span className="min-w-0 text-gray-700 dark:text-gray-300">
              {item.course_name || "Khóa học không còn tồn tại"}
            </span>
            <span className="shrink-0 font-medium">{formatCurrency(Number(item.final_price))}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-3 grid gap-1 border-t pt-3 text-sm dark:border-gray-800">
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">Tổng tiền</dt>
          <dd className="font-semibold">{formatCurrency(Number(order.total_amount))}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">Ngày tạo</dt>
          <dd>{formatOrderDateTime(order.created_at)}</dd>
        </div>
        {open && order.expires_at && (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Giữ đơn đến</dt>
            <dd>{formatOrderDateTime(order.expires_at)}</dd>
          </div>
        )}
      </dl>

      {open && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onCancel(order)}>
            Hủy đơn
          </Button>
          <Button onClick={() => onPay(order)}>Tiếp tục thanh toán</Button>
        </div>
      )}

      {isExpired && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">Đơn đã hết hạn giữ chỗ. Bạn có thể tạo đơn mới theo giá hiện tại.</p>
          <Button className="shrink-0" isLoading={isReordering} onClick={() => onReorder(order)}>
            Tạo đơn mới
          </Button>
        </div>
      )}
    </article>
  );
}
