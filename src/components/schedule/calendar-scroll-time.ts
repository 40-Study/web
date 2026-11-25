/**
 * Giờ lịch tự cuộn tới khi mở / đổi tuần (QA-B-25, 10/11/2026).
 *
 * Lịch cố định `scrollTime` 07:00, mà buổi học của lớp phần lớn ở 19:00-19:30: phụ huynh và giảng viên (chế độ
 * Ngày trên mobile) nhìn khung 07:00-16:00 trống trơn, tưởng tuần không có lịch. Quy tắc:
 * 1. có buổi trong khoảng đang xem -> cuộn tới khung giờ chứa NHIỀU buổi nhất (lùi 30 phút để thấy cả mép trên của
 *    thẻ). Hoà thì lấy khung SỚM hơn, nên khi mọi buổi nằm gọn một khung thì vẫn là buổi sớm nhất. Chỉ lấy "buổi sớm
 *    nhất" từng khiến một buổi lẻ 08:30 thứ Bảy kéo khung về 08:00 và giấu cả 5 buổi 19:00 các ngày trong tuần (Q6-PG-18);
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
/** Số giờ lịch nhìn thấy cùng lúc (ước lượng): khung cuộn cao ~520px, 64px/giờ. */
const VISIBLE_WINDOW_MINUTES = 8 * 60;
const DAY_MS = 86_400_000;

function toClock(minutes: number): string {
  const m = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`;
}

/** "YYYY-MM-DD" theo giờ máy (cùng cách FullCalendar so `startRecur`/`endRecur`). */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Phút trong ngày của MỌI lần xuất hiện của sự kiện trong [start, end). */
function occurrenceMinutesInRange(event: ScrollableEvent, start: Date, end: Date): number[] {
  if (event.weekly) {
    const [h, m] = event.weekly.startTime.split(":").map(Number);
    if (!Number.isFinite(h)) return [];
    const minutes: number[] = [];
    for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) {
      const day = new Date(t);
      const key = dayKey(day);
      if (event.weekly.startRecur && key < event.weekly.startRecur) continue;
      if (event.weekly.endRecur && key >= event.weekly.endRecur) continue;
      if (event.weekly.daysOfWeek.includes(day.getDay())) minutes.push(h * 60 + (m || 0));
    }
    return minutes;
  }
  const at = new Date(event.startTime);
  if (Number.isNaN(at.getTime()) || at < start || at >= end) return [];
  return [at.getHours() * 60 + at.getMinutes()];
}

/** Giờ bắt đầu của khung nhìn chứa nhiều buổi nhất; hoà thì lấy khung sớm hơn. */
function densestWindowStart(starts: readonly number[]): number {
  let best = Math.min(...starts);
  let bestCount = 0;
  for (const anchor of [...new Set(starts)].sort((a, b) => a - b)) {
    const count = starts.filter(minutes => minutes >= anchor && minutes < anchor + VISIBLE_WINDOW_MINUTES).length;
    if (count > bestCount) {
      best = anchor;
      bestCount = count;
    }
  }
  return best;
}

export function pickCalendarScrollTime(
  events: readonly ScrollableEvent[],
  range: { start: Date; end: Date },
  now: Date = new Date()
): string {
  const starts = events.flatMap(event => occurrenceMinutesInRange(event, range.start, range.end));
  if (starts.length > 0) return toClock(densestWindowStart(starts) - LEAD_MINUTES);
  if (now >= range.start && now < range.end) return toClock(now.getHours() * 60 + now.getMinutes() - LEAD_MINUTES);
  return toClock(DEFAULT_SCROLL_MINUTES);
}
