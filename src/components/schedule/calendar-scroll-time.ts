/**
 * Giờ lịch tự cuộn tới khi mở / đổi tuần (QA-B-25, 10/11/2026).
 *
 * Lịch cố định `scrollTime` 07:00, mà buổi học của lớp phần lớn ở 19:00-19:30: phụ huynh và giảng viên (chế độ
 * Ngày trên mobile) nhìn khung 07:00-16:00 trống trơn, tưởng tuần không có lịch. Quy tắc:
 * 1. có buổi trong khoảng đang xem -> cuộn tới buổi SỚM NHẤT (lùi 30 phút để thấy cả mép trên của thẻ);
 * 2. không có buổi, khoảng đang xem chứa hôm nay -> cuộn tới giờ hiện tại;
 * 3. còn lại -> 07:00 như cũ.
 * Giờ tính theo giờ máy (`getHours`), cùng múi giờ FullCalendar dùng để vẽ sự kiện (timeZone mặc định "local").
 */

interface ScrollableEvent {
  startTime: string;
  weekly?: { daysOfWeek: number[]; startTime: string; startRecur?: string; endRecur?: string };
}

const DEFAULT_SCROLL_MINUTES = 7 * 60;
const LEAD_MINUTES = 30;
const DAY_MS = 86_400_000;

function toClock(minutes: number): string {
  const m = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`;
}

/** "YYYY-MM-DD" theo giờ máy (cùng cách FullCalendar so `startRecur`/`endRecur`). */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Phút trong ngày của lần xuất hiện sớm nhất trong [start, end), hoặc null nếu không xuất hiện. */
function earliestMinutesInRange(event: ScrollableEvent, start: Date, end: Date): number | null {
  if (event.weekly) {
    const [h, m] = event.weekly.startTime.split(":").map(Number);
    if (!Number.isFinite(h)) return null;
    for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) {
      const day = new Date(t);
      const key = dayKey(day);
      if (event.weekly.startRecur && key < event.weekly.startRecur) continue;
      if (event.weekly.endRecur && key >= event.weekly.endRecur) continue;
      if (event.weekly.daysOfWeek.includes(day.getDay())) return h * 60 + (m || 0);
    }
    return null;
  }
  const at = new Date(event.startTime);
  if (Number.isNaN(at.getTime()) || at < start || at >= end) return null;
  return at.getHours() * 60 + at.getMinutes();
}

export function pickCalendarScrollTime(
  events: readonly ScrollableEvent[],
  range: { start: Date; end: Date },
  now: Date = new Date()
): string {
  let earliest: number | null = null;
  for (const event of events) {
    const minutes = earliestMinutesInRange(event, range.start, range.end);
    if (minutes !== null && (earliest === null || minutes < earliest)) earliest = minutes;
  }
  if (earliest !== null) return toClock(earliest - LEAD_MINUTES);
  if (now >= range.start && now < range.end) return toClock(now.getHours() * 60 + now.getMinutes() - LEAD_MINUTES);
  return toClock(DEFAULT_SCROLL_MINUTES);
}
