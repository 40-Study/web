/**
 * Hiển thị mốc thời gian/ngày của API theo GIỜ VIỆT NAM, không để chuỗi ISO thô lọt ra giao diện (QA B-17, A-20).
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

// Dựng một lần ở mức module: tạo `Intl.DateTimeFormat` tốn kém (nạp dữ liệu locale + múi giờ), mà hàm
// dưới được gọi theo từng dòng bảng (vd điểm danh). Formatter không giữ trạng thái nên dùng chung được.
const VN_DATE_TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", VN_DATE_TIME_OPTIONS);

/** "10:00 28/09/2026"; null/rỗng/chuỗi không parse được thì "—" (không hiện "Invalid Date"). */
export function formatVnDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return VN_DATE_TIME_FORMAT.format(date);
}

/**
 * "07/10/2026 19:00" — NGÀY trước, giờ sau (F-18, QA2 261013). `formatVnDateTime` giữ nguyên "19:00 07/10/2026"
 * cho các trang đã dùng nó; dựng từ `formatToParts` thay vì cắt chuỗi để không phụ thuộc thứ tự mà locale in ra.
 */
export function formatVnDateThenTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const parts = new Map(VN_DATE_TIME_FORMAT.formatToParts(date).map((p) => [p.type, p.value]));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.get(type) ?? "";
  return `${part("day")}/${part("month")}/${part("year")} ${part("hour")}:${part("minute")}`;
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * "2026-10-03" -> "03/10/2026". Ngày thuần (không có giờ) được tách bằng chuỗi, KHÔNG qua `new Date`:
 * "YYYY-MM-DD" bị JS hiểu là nửa đêm UTC nên ở múi giờ âm sẽ hiện lùi một ngày.
 */
export function formatVnDateOnly(ymd: string | null | undefined): string {
  if (!ymd) return "—";
  const match = DATE_ONLY_PATTERN.exec(ymd);
  if (!match) return formatVnDateTime(ymd);
  return `${match[3]}/${match[2]}/${match[1]}`;
}