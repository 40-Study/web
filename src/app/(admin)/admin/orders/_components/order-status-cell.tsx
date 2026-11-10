import { Badge } from "@/components/ui/badge";
import { lateRefundSummaryText } from "@/lib/late-refund";
import { ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/services/order.service";

// Màu badge theo trạng thái — "refunded"/"cancelled" PHẢI khác màu nhau (lỗi đã có
// ở trang /admin/reports cũ: đánh đồng 2 trạng thái này, xem qa-260927-admin.md).
const STATUS_VARIANT: Record<OrderStatus, "success" | "warning" | "destructive" | "outline" | "secondary"> = {
  pending: "outline",
  processing: "warning",
  completed: "success",
  cancelled: "secondary",
  refunded: "destructive",
  expired: "outline",
};

const REFUND_NEEDED_BADGE = "Cần hoàn tiền";
const REFUNDED_LATE_BADGE = "Đã hoàn tiền";

type OrderStatusFields = Pick<Order, "status" | "refund_needed" | "late_refunded_at" | "late_refunds">;

/** Trạng thái đơn + cờ tiền về muộn; dùng chung cho bảng (desktop) và thẻ (mobile) ở /admin/orders. */
export function OrderStatusCell({ order }: { order: OrderStatusFields }) {
  const summary = order.refund_needed ? lateRefundSummaryText(order.late_refunds) : null;
  return (
    <>
      <div className="flex flex-wrap gap-1">
        <Badge variant={STATUS_VARIANT[order.status]} className="whitespace-nowrap">
          {ORDER_STATUS_LABEL[order.status]}
        </Badge>
        {/* Tiền về cho đơn đã huỷ/hết hạn: đơn không khôi phục, admin hoàn tiền tay
            (quyết định chủ dự án, review #76 final). */}
        {order.refund_needed && <Badge variant="destructive">{REFUND_NEEDED_BADGE}</Badge>}
        {/* Admin đã ghi nhận chuyển khoản hoàn ở trang chi tiết: cờ tắt, badge đổi tên. */}
        {!order.refund_needed && order.late_refunded_at && <Badge variant="success">{REFUNDED_LATE_BADGE}</Badge>}
      </div>
      {/* L6: bao nhiêu khoản, tổng tiền cần hoàn (chi tiết mã giao dịch ở trang đơn). */}
      {summary && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400" data-testid="late-refund-summary">
          {summary}
        </p>
      )}
    </>
  );
}
