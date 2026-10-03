/**
 * Dựng sự kiện cho lịch giảng dạy (B-08, B-09).
 *
 * Trước đây trang lịch của giảng viên chỉ vẽ buổi livestream (`useLiveSessions`), nên lịch học lặp
 * tuần của lớp và buổi học cụ thể tạo qua `POST /classes/:id/sessions` không hiện ở đâu cả. Hai nguồn
 * mới đến từ `GET /me/timetable`: lịch lặp tuần (mục có `schedule_id`) và buổi cụ thể (mục có
 * `session_id` + `date`).
 */

import { addDays, addHours, format } from "date-fns";
import type { ScheduleEvent } from "@/components/schedule/week-calendar-grid";
import type { LiveSession } from "@/services/live-session.service";
import type { TimetableEntry } from "@/types/class-schedule";
import { parseClockTime } from "@/lib/schedule-time";

const pad = (n: number) => String(n).padStart(2, "0");

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
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    type: "livestream",
    status: statusOf(s.status),
    description: s.description || undefined,
    location: s.location || undefined,
    teacher: "Bạn",
    kind: "livestream",
  };
}

/**
 * Mục thời khoá biểu → sự kiện chỉ xem:
 * - lịch lặp tuần (`schedule_id`, không `session_id`) → recurring event theo thứ trong tuần, giới hạn bởi
 *   `effective_from`/`effective_until`;
 * - buổi ngoài lịch (`session_id`, không `schedule_id`) → sự kiện một lần ở `date`.
 * Buổi sinh từ lịch lặp (có cả hai id) bỏ qua vì lịch lặp đã vẽ nó rồi (tránh hiện đôi).
 * Giờ không đọc được thì bỏ mục, không vẽ khối ở toạ độ NaN.
 */
export function timetableEntriesToEvents(entries: TimetableEntry[]): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];
  for (const e of entries) {
    const start = parseClockTime(e.start_time);
    const end = parseClockTime(e.end_time);
    if (!start || !end) continue;
    const startHHmm = `${pad(start.hours)}:${pad(start.minutes)}`;
    const endHHmm = `${pad(end.hours)}:${pad(end.minutes)}`;

    if (e.schedule_id && !e.session_id) {
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
    } else if (e.session_id && !e.schedule_id && e.date) {
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

/**
 * Khoảng ngày đang xem của FullCalendar (`end` loại trừ, nửa đêm) → khoảng YYYY-MM-DD gồm cả hai đầu
 * mà `GET /me/timetable` nhận.
 */
export function visibleDateRange(start: Date, end: Date): { from: string; to: string } {
  return { from: format(start, "yyyy-MM-dd"), to: format(addDays(end, -1), "yyyy-MM-dd") };
}
