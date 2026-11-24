/**
 * "Hoàn thành tháng 10/2026" cho thẻ chứng chỉ ở /my-courses và khoá đã học xong ở /profile (một định dạng chung). `month: "short"` của vi-VN cho "thg 10" và bỏ dấu
 * hai chấm thành "Hoàn thành: thg 10 2026" (QA5 S5-08); dạng số tháng/năm đọc rõ và không phụ thuộc ICU.
 */
export function formatCompletedMonth(iso: string | Date | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `Hoàn thành tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
}
