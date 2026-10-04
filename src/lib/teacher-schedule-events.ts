/**
 * Dựng sự kiện cho lịch giảng dạy (B-08, B-09).
 *
 * Trước đây trang lịch của giảng viên chỉ vẽ buổi livestream (`useLiveSessions`), nên lịch học lặp
 * tuần của lớp và buổi học cụ thể tạo qua `POST /classes/:id/sessions` không hiện ở đâu cả. Hai nguồn
 * mới đến từ `GET /me/timetable`: lịch lặp tuần (mục có `schedule_id`) và buổi cụ thể (mục có
 * `session_id` + `date`).
 *
 * Quy ước giờ của MỌI sự kiện trên trang này (W2-B): `startTime`/`endTime` là ISO của một Date mà các trường
 * LOCAL (getHours()...) chính là giờ đồng hồ Việt Nam cần hiển thị. Buổi lớp vốn đã vậy (giờ "HH:MM" ghi sẵn,
 * không có múi giờ); buổi livestream là một khoảnh khắc thật nên phải đổi sang giờ VN (`toVnWallClock`), nếu
 * không giảng viên mở máy ngoài múi giờ VN sẽ thấy livestream lệch giờ so với buổi lớp và trang học viên.
 */

import { addDays, addHours, format } from "date-fns";
import type { ScheduleEvent } from "@/components/schedule/week-calendar-grid";
import type { LiveSession } from "@/services/live-session.service";
import type { TimetableEntry, TimetableOccurrence } from "@/types/class-schedule";
import { parseClockTime } from "@/lib/schedule-time";

const pad = (n: number) => String(n).padStart(2, "0");

const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VN_OFFSET = "+07:00";
const vnFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: VN_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Khoảnh khắc `instant` → Date có trường LOCAL bằng giờ đồng hồ Việt Nam của khoảnh khắc đó. */
export function toVnWallClock(instant: Date): Date {
  const p: Record<string, number> = {};
  for (const part of vnFormatter.formatToParts(instant)) {
    if (part.type !== "literal") p[part.type] = Number(part.value);
  }
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

/**
 * Ngược của `toVnWallClock`: Date có trường LOCAL là giờ VN (form nhập giờ) → RFC3339 có offset +07:00 để gửi backend.
 * Không dùng `toISOString()` trực tiếp: nó diễn giải trường local theo múi giờ của trình duyệt nên máy ngoài VN gửi
 * sai khoảnh khắc.
 */
export function vnWallClockToIso(wall: Date): string {
  const date = `${wall.getFullYear()}-${pad(wall.getMonth() + 1)}-${pad(wall.getDate())}`;
  return `${date}T${pad(wall.getHours())}:${pad(wall.getMinutes())}:${pad(wall.getSeconds())}${VN_OFFSET}`;
}

function statusOf(status: LiveSession["status"]): ScheduleEvent["status"] {
  if (status === "live") return "ongoing";
  if (status === "ended") return "completed";
  return "upcoming";
}

/** Một buổi livestream → sự kiện. Giờ kết thúc: giờ thật khi đã kết thúc, giờ dự kiến GV nhập, hoặc +1 giờ. */
export function liveSessionToEvent(s: LiveSession): ScheduleEvent {
  const start = new Date(s.scheduled_at ?? s.created_at);
  const planned = s.scheduled_end_at ? new Date(s.scheduled_end_at) : null;
  const actual = s.ended_at ? new Date(s.ended_at) : null;
  const chosen = s.status === "ended" ? (actual ?? planned) : (planned ?? actual);
  // Giờ kết thúc không hợp lệ hoặc không sau giờ bắt đầu thì vẽ khối 1 giờ, không vẽ khối âm.
  const end = chosen && !Number.isNaN(chosen.getTime()) && chosen > start ? chosen : addHours(start, 1);
  return {
    id: s.id,
    title: s.title,
    courseId: s.course_id,
    startTime: toVnWallClock(start).toISOString(),
    endTime: toVnWallClock(end).toISOString(),
    type: "livestream",
    status: statusOf(s.status),
    description: s.description || undefined,
    location: s.location || undefined,
    teacher: "Bạn",
    kind: "livestream",
  };
}

interface TimetableEventOptions {
  /**
   * Khoảng ngày đang xem (YYYY-MM-DD, gồm cả hai đầu). Có thì lịch lặp tuần được trải thành từng ngày trong khoảng để
   * bỏ được ngày có buổi riêng (đã sửa giờ) hoặc đã huỷ; không có thì vẽ như lịch lặp thuần theo thứ.
   */
  range?: { from: string; to: string };
  /** Buổi sinh từ lịch lặp đã bị huỷ: backend không trả chúng ở `entries`. */
  cancelled?: TimetableOccurrence[];
}

const dayKey = (date: Date) => format(date, "yyyy-MM-dd");

/**
 * Mục thời khoá biểu → sự kiện chỉ xem:
 * - lịch lặp tuần (`schedule_id`, không `session_id`) → theo thứ trong tuần, giới hạn bởi
 *   `effective_from`/`effective_until`;
 * - buổi cụ thể (`session_id` + `date`) → sự kiện một lần ở `date`, đúng giờ thật của buổi.
 * Có `options.range`: buổi sinh từ lịch lặp (có cả hai id) được vẽ theo giờ thật của nó và ngày đó bị bỏ khỏi lịch lặp,
 * ngày có buổi huỷ cũng bị bỏ. Không có `range` thì không biết ngày nào để bỏ nên buổi sinh từ lịch lặp bị
 * lược đi (lịch lặp đã vẽ nó rồi, tránh hiện đôi).
 * Giờ không đọc được thì bỏ mục, không vẽ khối ở toạ độ NaN.
 */
export function timetableEntriesToEvents(entries: TimetableEntry[], options: TimetableEventOptions = {}): ScheduleEvent[] {
  const { range, cancelled = [] } = options;

  // Ngày đã có buổi riêng hoặc đã huỷ, theo từng lịch lặp: lịch lặp không được vẽ lại ngày đó.
  const skipDates = new Map<string, Set<string>>();
  const markSkipped = (scheduleId: string | undefined, date: string | undefined) => {
    if (!scheduleId || !date) return;
    const key = date.slice(0, 10);
    const set = skipDates.get(scheduleId) ?? new Set<string>();
    set.add(key);
    skipDates.set(scheduleId, set);
  };
  for (const c of cancelled) markSkipped(c.schedule_id, c.date);
  const weeklyDow = new Map<string, number>();
  for (const e of entries) if (e.schedule_id && !e.session_id) weeklyDow.set(e.schedule_id, e.day_of_week);
  for (const e of entries) {
    if (!e.session_id) continue;
    markSkipped(e.schedule_id, e.date);
    // Buổi dời sang THỨ khác: backend không báo ngày gốc (không có cancelled_occurrences, chỉ trả ngày mới), nên ngày
    // gốc chỉ được suy ra khi CHẮC: ngày lịch lặp lệch ≤ 2 ngày (ngày lặp kia cách ≥ 5 ngày). Lệch 3 ngày (hai ngày lặp
    // cách 3 và 4) hay dời sang cùng thứ của tuần khác thì không chắc: hiện cả bóng lẫn buổi thật, không ẩn nhầm.
    // Cần backend trả ngày gốc để hết mơ hồ.
    const dow = e.schedule_id ? weeklyDow.get(e.schedule_id) : undefined;
    const origin = dow !== undefined && e.date ? nearbyOccurrence(e.date, dow) : undefined;
    if (origin) markSkipped(e.schedule_id, origin);
  }

  const events: ScheduleEvent[] = [];
  for (const e of entries) {
    const start = parseClockTime(e.start_time);
    const end = parseClockTime(e.end_time);
    if (!start || !end) continue;
    const startHHmm = `${pad(start.hours)}:${pad(start.minutes)}`;
    const endHHmm = `${pad(end.hours)}:${pad(end.minutes)}`;

    if (e.schedule_id && !e.session_id) {
      if (range) {
        events.push(...expandWeekly(e, startHHmm, endHHmm, range, skipDates.get(e.schedule_id)));
        continue;
      }
      // endRecur của FullCalendar loại trừ ngày cuối nên cộng 1 ngày để ngày hết hạn vẫn có buổi.
      const until = e.effective_until ? format(addDays(new Date(`${e.effective_until}T00:00:00`), 1), "yyyy-MM-dd") : undefined;
      events.push({
        id: `class-schedule-${e.schedule_id}`,
        title: e.class_name || "Lịch học của lớp",
        startTime: new Date(2000, 0, 1, start.hours, start.minutes).toISOString(),
        endTime: new Date(2000, 0, 1, end.hours, end.minutes).toISOString(),
        type: "video",
        status: "upcoming",
        location: e.room || undefined,
        teacher: "Bạn",
        kind: "class-schedule",
        weekly: {
          daysOfWeek: [e.day_of_week],
          startTime: startHHmm,
          endTime: endHHmm,
          startRecur: e.effective_from,
          endRecur: until,
        },
      });
    } else if (e.session_id && e.date && (range || !e.schedule_id)) {
      const day = e.date.slice(0, 10);
      const startAt = new Date(`${day}T${startHHmm}:00`);
      const endAt = new Date(`${day}T${endHHmm}:00`);
      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) continue;
      events.push({
        id: `class-session-${e.session_id}`,
        title: e.topic ? `${e.class_name}: ${e.topic}` : e.class_name || "Buổi học của lớp",
        startTime: startAt.toISOString(),
        endTime: endAt.toISOString(),
        type: "video",
        status: e.status === "completed" ? "completed" : e.status === "in_progress" ? "ongoing" : "upcoming",
        location: e.room || undefined,
        teacher: "Bạn",
        kind: "class-session",
      });
    }
  }
  return events;
}

/** Ngày của thứ `dow` (0 = Chủ nhật) cách `date` tối đa 2 ngày (kể cả chính `date`); không có thì undefined. */
function nearbyOccurrence(date: string, dow: number): string | undefined {
  const d = new Date(`${date.slice(0, 10)}T00:00:00`);
  let offset = (dow - d.getDay() + 7) % 7;
  if (offset > 3) offset -= 7;
  return Math.abs(offset) <= 2 ? dayKey(addDays(d, offset)) : undefined;
}

/** Trải một lịch lặp tuần thành sự kiện một lần cho từng ngày trong `range`, bỏ các ngày trong `skip`. */
function expandWeekly(
  e: TimetableEntry,
  startHHmm: string,
  endHHmm: string,
  range: { from: string; to: string },
  skip?: Set<string>,
): ScheduleEvent[] {
  const first = range.from > (e.effective_from ?? "") ? range.from : (e.effective_from ?? range.from);
  const last = e.effective_until && e.effective_until < range.to ? e.effective_until : range.to;
  const out: ScheduleEvent[] = [];
  for (let d = new Date(`${first.slice(0, 10)}T00:00:00`); dayKey(d) <= last.slice(0, 10); d = addDays(d, 1)) {
    if (d.getDay() !== e.day_of_week) continue;
    const day = dayKey(d);
    if (skip?.has(day)) continue;
    out.push({
      id: `class-schedule-${e.schedule_id}-${day}`,
      title: e.class_name || "Lịch học của lớp",
      startTime: new Date(`${day}T${startHHmm}:00`).toISOString(),
      endTime: new Date(`${day}T${endHHmm}:00`).toISOString(),
      type: "video",
      status: "upcoming",
      location: e.room || undefined,
      teacher: "Bạn",
      kind: "class-schedule",
    });
  }
  return out;
}

/**
 * Khoảng ngày đang xem của FullCalendar (`end` loại trừ, nửa đêm) → khoảng YYYY-MM-DD gồm cả hai đầu
 * mà `GET /me/timetable` nhận.
 */
export function visibleDateRange(start: Date, end: Date): { from: string; to: string } {
  return { from: format(start, "yyyy-MM-dd"), to: format(addDays(end, -1), "yyyy-MM-dd") };
}
