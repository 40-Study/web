import { formatWithdrawalAmount } from "@/lib/withdrawal-format";
import { formatVnDateThenTime } from "@/lib/vn-datetime";
import type { TeacherTransaction } from "@/services/wallet.service";

type BadgeVariant = "success" | "warning" | "secondary" | "destructive";

const STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  completed: { label: "Hoàn thành", variant: "success" },
  pending: { label: "Chờ xử lý", variant: "warning" },
  cancelled: { label: "Đã huỷ", variant: "secondary" },
  failed: { label: "Thất bại", variant: "destructive" },
  refunded: { label: "Hoàn tiền", variant: "destructive" },
};

export function getStatusConfig(status: string): { label: string; variant: BadgeVariant } {
  return STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as BadgeVariant };
}

// QA-B-14: trang ví từng trộn "22/9/2026" (giao dịch) với "29/09/2026 23:23" (rút tiền) và "438.200 ₫" với
// "250.000đ". Cả trang dùng chung một định dạng: ngày giờ VN "dd/MM/yyyy HH:mm", tiền "438.200đ" như khối rút tiền.
export const formatDate = formatVnDateThenTime;
export const formatMoney = formatWithdrawalAmount;

/**
 * Dấu và màu của số tiền một giao dịch. P2 QA 260927 teacher: trước đây +/- và màu chỉ phụ thuộc `tx.type`, bỏ qua
 * hẳn `tx.status`: 1 đơn "Đã huỷ" vẫn hiện "+499.000 ₫" màu xanh y hệt thu nhập thật. Chỉ dấu "+"/màu xanh khi giao
 * dịch thật sự hoàn tất; trạng thái khác hiện trung tính, không dấu. Hoàn tiền luôn "-" màu đỏ.
 */
export function transactionAmountDisplay(tx: Pick<TeacherTransaction, "type" | "status">): {
  sign: string;
  className: string;
} {
  if (tx.type === "expense") return { sign: "-", className: "text-red-500" };
  if (tx.status === "completed") return { sign: "+", className: "text-green-600" };
  return { sign: "", className: "text-muted-foreground" };
}
