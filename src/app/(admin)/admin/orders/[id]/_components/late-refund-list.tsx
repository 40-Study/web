import { Badge } from "@/components/ui/badge";
import { formatLateRefundAmount } from "@/lib/late-refund";
import { formatOrderDateTime, type LateRefundSummary } from "@/services/order.service";

/**
 * Danh sách các khoản tiền về muộn của đơn (L6): mã giao dịch, số tiền, thời điểm gắn cờ và khoản nào đã
 * được hoàn. Admin dùng để đối soát với sao kê ngân hàng thay vì phải lần trong log.
 */
export function LateRefundList({ summary }: { summary: LateRefundSummary }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950" data-testid="late-refund-list">
      <h2 className="mb-1 text-base font-semibold">Khoản tiền về muộn</h2>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        {summary.pending_count > 0
          ? `${summary.pending_count} khoản chờ hoàn.`
          : "Không còn khoản nào chờ hoàn."}
      </p>
      <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
        {summary.items.map((item) => (
          <li key={item.ref} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
            <span className="font-mono text-xs">{item.transaction_id || "(không có mã giao dịch)"}</span>
            <span className="font-medium">{formatLateRefundAmount(item.amount)}</span>
            <span className="text-xs text-gray-400">{formatOrderDateTime(item.flagged_at)}</span>
            <span className="ml-auto">
              {item.refunded ? <Badge variant="success">Đã hoàn</Badge> : <Badge variant="destructive">Chờ hoàn</Badge>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}