/**
 * Chú thích cho thẻ "Tỷ lệ thành công" của báo cáo doanh thu admin.
 *
 * B-19 (QA hồi quy 03/10): thẻ hiện "23.1%" nhưng chú thích ghi "3 hoàn tất / 15 đơn trong kỳ" (3/15 = 20%).
 * Backend (calculateSuccessRate, admin_order_service.go) lấy mẫu số là completed + failed + cancelled +
 * expired, loại đơn chờ/đang xử lý và đơn hoàn tiền; còn `transaction_count` là MỌI đơn. Chú thích phải
 * dùng đúng mẫu số của phép tính để người đọc nhẩm lại ra cùng con số.
 */
const SETTLED_STATUSES = ["completed", "failed", "cancelled", "expired"] as const;

type SuccessRateInput = { success_rate: number; by_status: Record<string, number> };

function settledCount(by_status: Record<string, number>): number {
  return SETTLED_STATUSES.reduce((sum, key) => sum + (by_status[key] ?? 0), 0);
}

/**
 * Giá trị thẻ "Tỷ lệ thành công". QA3-13: kỳ không có đơn nào đã có kết quả (mẫu số 0) thì backend trả 0,
 * và "0.0%" đọc như một tỷ lệ thất bại thật. Không có mẫu số thì không có tỷ lệ: hiện "—".
 */
export function successRateValue(report: SuccessRateInput): string {
  if (settledCount(report.by_status) === 0) return "—";
  // QA7-A07: dấu phẩy thập phân kiểu vi-VN ("23,1%"), cùng cách các màn khác ("Giảm 1,5đ").
  return `${report.success_rate.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function successRateHint(report: {
  completed_count: number;
  transaction_count: number;
  by_status: Record<string, number>;
}): string {
  const settled = settledCount(report.by_status);
  const unsettled = Math.max(0, report.transaction_count - settled);
  const tail = unsettled > 0 ? ` (chưa tính ${unsettled} đơn đang chờ hoặc hoàn tiền)` : "";
  return `${report.completed_count} hoàn tất / ${settled} đơn đã có kết quả${tail}`;
}

/** Số ngày của từng bộ lọc kỳ ở /admin/reports. */
export const REVENUE_PERIOD_DAYS = { "7days": 7, "30days": 30, "90days": 90 } as const;
export type RevenuePeriod = keyof typeof REVENUE_PERIOD_DAYS;

/**
 * Khoảng thời gian của báo cáo doanh thu, tính theo NGÀY (Q11-ADMIN-01): từ 00:00 của ngày đầu tiên trong kỳ đến 23:59:59.999
 * hôm nay (giờ máy). Trước đây dùng `new Date()` nguyên giây nên mỗi lần mount ra một khoá query mới: mỗi lần quay lại trang là
 * cache miss (spinner, cache phình ra) và refetch lỗi không còn dữ liệu cũ để giữ. Trong cùng một ngày hai lần gọi cho cùng
 * kỳ trả đúng cùng chuỗi, nên khoá lặp lại.
 */
export function revenueReportRange(period: RevenuePeriod, now: Date = new Date()): { from: string; to: string } {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (REVENUE_PERIOD_DAYS[period] - 1), 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}
