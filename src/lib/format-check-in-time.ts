/**
 * Q5-PG-03: backend trả `check_in_time` là giờ Việt Nam dạng "19:05" (QA4 N-12), nhưng một số đường cũ
 * trả ISO. Chấp nhận cả hai và luôn in "HH:mm" theo giờ Việt Nam; giá trị không đọc được thì trả null
 * (không in chuỗi rác lên màn hình).
 */
export function formatCheckInTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const hhmm = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (hhmm) return `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`;
  const t = new Date(value);
  if (Number.isNaN(t.getTime())) return null;
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(t);
}
