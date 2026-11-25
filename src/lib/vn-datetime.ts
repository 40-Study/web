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

const SESSION_DAY_PATTERN = /^(\d{4}-\d{2}-\d{2})/;
const SESSION_TIME_PATTERN = /^(\d{2}:\d{2})/;

/**
 * Buổi học (ngày + giờ bắt đầu, GIỜ VIỆT NAM UTC+7, không có giờ mùa hè) có BẮT ĐẦU SAU `now` không (Q5-T02, M1).
 * `date` có thể là "2026-11-02" hoặc RFC3339 nửa đêm: chỉ lấy phần ngày, không qua `new Date(date)` vì phần giờ của
 * nó không phải giờ bắt đầu buổi. Không dựng được mốc (thiếu/sai định dạng) thì trả false: không chứng minh được
 * buổi còn ở tương lai thì không cho thao tác huỷ.
 */
export function isVnSessionUpcoming(
  date: string | null | undefined,
  startTime: string | null | undefined,
  now: Date = new Date()
): boolean {
  const start = vnSessionInstant(date, startTime);
  return start !== null && start > now.getTime();
}

/**
 * Buổi học đã BẮT ĐẦU (giờ bắt đầu, giờ VN, không còn sau `now`) chưa (Q6 #130 M2). Thiếu/sai định dạng thì false:
 * không chứng minh được buổi đã bắt đầu thì không tuyên bố "đang diễn ra".
 */
export function hasVnSessionStarted(
  date: string | null | undefined,
  startTime: string | null | undefined,
  now: Date = new Date()
): boolean {
  const start = vnSessionInstant(date, startTime);
  return start !== null && start <= now.getTime();
}

/**
 * Buổi học đã KẾT THÚC (giờ kết thúc, giờ VN, không còn sau `now`) chưa (Q6-T04). Cùng cách đọc `date`/giờ với
 * `isVnSessionUpcoming`. Thiếu/sai định dạng thì false: không chứng minh được buổi đã qua thì không tuyên bố "đã diễn ra".
 * Truyền `startTime` để nhận ra buổi qua nửa đêm (giờ kết thúc < giờ bắt đầu thì kết thúc vào NGÀY HÔM SAU). Giờ kết thúc
 * BẰNG giờ bắt đầu (độ dài 0, dữ liệu xấu) không phải buổi 24 giờ: coi như kết thúc ngay lúc bắt đầu (#134 L-2).
 */
export function hasVnSessionEnded(
  date: string | null | undefined,
  endTime: string | null | undefined,
  now: Date = new Date(),
  startTime?: string | null
): boolean {
  let end = vnSessionInstant(date, endTime);
  if (end === null) return false;
  const start = startTime ? vnSessionInstant(date, startTime) : null;
  if (start !== null && end < start) end += 86_400_000;
  return end <= now.getTime();
}

/** Mốc (epoch ms) của `date` + `time` theo giờ VN; null khi thiếu hoặc sai định dạng. */
function vnSessionInstant(date: string | null | undefined, time: string | null | undefined): number | null {
  const day = date ? SESSION_DAY_PATTERN.exec(date)?.[1] : undefined;
  const hhmm = time ? SESSION_TIME_PATTERN.exec(time)?.[1] : undefined;
  if (!day || !hhmm) return null;
  const at = new Date(`${day}T${hhmm}:00+07:00`).getTime();
  return Number.isNaN(at) ? null : at;
}
