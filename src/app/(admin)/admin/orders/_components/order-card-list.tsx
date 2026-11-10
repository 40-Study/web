import Link from "next/link";
import { formatVnd } from "@/lib/vnd-format";
import { formatVnDateTime } from "@/lib/vn-datetime";
import type { AdminOrderListItem } from "@/services/admin-order.service";
import { OrderStatusCell } from "./order-status-cell";

/**
 * Đơn hàng dạng thẻ cho màn hẹp (QA-C-21): ở 390px bảng 7 cột chỉ hiện được mã đơn, còn tiền, trạng thái, ngày nằm
 * ngoài khung và nút "Chi tiết" bị ép vỡ chữ. Từ `sm` trở lên trang vẫn dùng bảng.
 */
export function OrderCardList({ items }: { items: AdminOrderListItem[] }) {
  return (
    <ul className="space-y-3 sm:hidden" aria-label="Danh sách đơn hàng">
      {items.map((order) => (
        <li key={order.id} className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 break-all text-sm font-medium">{order.order_number}</p>
            <p className="shrink-0 whitespace-nowrap text-sm font-semibold">{formatVnd(order.total_amount)}</p>
          </div>
          <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-400">{order.user_email}</p>
          <p className="line-clamp-2 text-xs text-gray-500">{order.items.map((i) => i.course_title).join(", ") || "-"}</p>
          <div className="mt-2">
            <OrderStatusCell order={order} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500">{formatVnDateTime(order.created_at)}</span>
            <Link
              href={`/admin/orders/${order.id}`}
              className="whitespace-nowrap rounded bg-gray-100 px-3 py-1.5 text-xs font-medium hover:bg-gray-200 dark:bg-gray-800"
            >
              Chi tiết
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
