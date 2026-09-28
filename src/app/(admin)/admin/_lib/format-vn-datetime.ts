/**
 * Hiển thị mốc thời gian API theo GIỜ VIỆT NAM cho các trang admin.
 *
 * QA vòng 2 (G1 — N10/N-12): backend từng trả giờ local kèm chữ `Z` ("…T10:00:00Z" cho 10:00 giờ
 * VN) nên mọi nơi hiển thị lệch +7h. Backend nay trả RFC3339 có offset thật ("…T10:00:00+07:00").
 * Phía web chốt `timeZone: "Asia/Ho_Chi_Minh"` thay vì dựa vào múi giờ của trình duyệt/máy chạy
 * test, để cùng một mốc luôn ra cùng một giờ Việt Nam (máy CI chạy UTC vẫn đúng).
 */

const VN_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

/** "10:00 28/09/2026"; null/rỗng/chuỗi không parse được thì "—" (không hiện "Invalid Date"). */
export function formatVnDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", VN_DATE_TIME_OPTIONS);
}
