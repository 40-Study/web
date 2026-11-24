import { Badge } from "@/components/ui/badge";
import type { TeacherTransaction } from "@/services/wallet.service";
import { formatDate, formatMoney, getStatusConfig, transactionAmountDisplay } from "./transaction-display";

/**
 * Q4-T18: dưới md, bảng giao dịch 6 cột (min-w 640px) đẩy "Giá bán" và "Trạng thái" vào thanh cuộn ngang. Mỗi giao
 * dịch là một thẻ có đủ mã, ngày, khoá, người mua, giá bán và trạng thái.
 */
export function TransactionCardList({ transactions }: { transactions: TeacherTransaction[] }) {
  if (transactions.length === 0) {
    return <p className="p-6 text-center text-sm text-muted-foreground">Không có giao dịch nào.</p>;
  }
  return (
    <ul className="divide-y" data-testid="transaction-cards">
      {transactions.map((tx) => {
        const amount = transactionAmountDisplay(tx);
        const cfg = getStatusConfig(tx.status);
        return (
          <li key={`${tx.order_id}-${tx.course_id}`} className="space-y-1 py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-sm font-medium">{tx.course_name}</p>
              <span className={`whitespace-nowrap text-sm font-medium ${amount.className}`}>
                {amount.sign}
                {formatMoney(tx.amount)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {tx.order_number} · {formatDate(tx.created_at)}
            </p>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="min-w-0 truncate">Người mua: {tx.buyer_name}</span>
              <Badge variant={cfg.variant} className="whitespace-nowrap">
                {cfg.label}
              </Badge>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
