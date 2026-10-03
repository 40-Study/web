/**
 * B-08/B-09: lịch giảng dạy phải thấy lịch lặp tuần và buổi học cụ thể của lớp, và vẽ đúng giờ kết thúc /
 * phòng đã lưu của buổi livestream (trước đây luôn +1 giờ).
 */

import { format } from "date-fns";
import { describe, expect, it } from "vitest";
import type { LiveSession } from "@/services/live-session.service";
import type { TimetableEntry } from "@/types/class-schedule";
import { liveSessionToEvent, timetableEntriesToEvents, visibleDateRange } from "./teacher-schedule-events";

const hhmm = (iso: string) => format(new Date(iso), "HH:mm");

function live(over: Partial<LiveSession>): LiveSession {
  return {
    id: "ls1",
    title: "Live",
    description: "",
    host_id: "h",
    class_id: "c",
    room_name: "r",
    status: "scheduled",
    max_viewers: 100,
    is_recorded: false,
    settings: "{}",
    created_at: "2026-10-01T00:00:00+07:00",
    ...over,
  };
}

function entry(over: Partial<TimetableEntry>): TimetableEntry {
  return { class_name: "ReactJS K12", class_id: "c", day_of_week: 1, start_time: "19:00", end_time: "21:00", status: "active", ...over };
}

describe("liveSessionToEvent", () => {
  it("dùng giờ kết thúc dự kiến và phòng đã lưu thay vì mặc định 1 giờ", () => {
    const ev = liveSessionToEvent(
      live({ scheduled_at: "2026-10-05T14:00:00+07:00", scheduled_end_at: "2026-10-05T15:30:00+07:00", location: "Phòng 301" })
    );
    expect(new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()).toBe(90 * 60_000);
    expect(ev.location).toBe("Phòng 301");
    expect(ev.kind).toBe("livestream");
  });

  it("buổi cũ không có giờ kết thúc: vẽ 1 giờ; buổi đã kết thúc: dùng giờ kết thúc thật", () => {
    const old = liveSessionToEvent(live({ scheduled_at: "2026-10-05T14:00:00+07:00" }));
    expect(new Date(old.endTime).getTime() - new Date(old.startTime).getTime()).toBe(60 * 60_000);

    const ended = liveSessionToEvent(
      live({ status: "ended", scheduled_at: "2026-10-05T14:00:00+07:00", scheduled_end_at: "2026-10-05T15:00:00+07:00", ended_at: "2026-10-05T16:10:00+07:00" })
    );
    expect(new Date(ended.endTime).getTime() - new Date(ended.startTime).getTime()).toBe(130 * 60_000);
    expect(ended.status).toBe("completed");
  });

  it("giờ kết thúc không sau giờ bắt đầu không tạo khối âm", () => {
    const ev = liveSessionToEvent(live({ scheduled_at: "2026-10-05T14:00:00+07:00", scheduled_end_at: "2026-10-05T13:00:00+07:00" }));
    expect(new Date(ev.endTime).getTime()).toBeGreaterThan(new Date(ev.startTime).getTime());
  });
});

describe("timetableEntriesToEvents", () => {
  it("lịch lặp tuần thành recurring event theo thứ, có giới hạn hiệu lực", () => {
    const [ev] = timetableEntriesToEvents([
      entry({ schedule_id: "sch1", day_of_week: 3, room: "Phòng 301", effective_from: "2026-09-01", effective_until: "2026-12-31" }),
    ]);
    expect(ev.kind).toBe("class-schedule");
    expect(ev.weekly).toEqual({ daysOfWeek: [3], startTime: "19:00", endTime: "21:00", startRecur: "2026-09-01", endRecur: "2027-01-01" });
    expect(ev.location).toBe("Phòng 301");
    expect(hhmm(ev.startTime)).toBe("19:00");
  });

  it("buổi ngoài lịch thành sự kiện một lần đúng ngày giờ; buổi sinh từ lịch lặp không hiện đôi", () => {
    const events = timetableEntriesToEvents([
      entry({ session_id: "s1", date: "2026-10-05", start_time: "19:00", end_time: "20:30", topic: "Buổi 1" }),
      entry({ session_id: "s2", schedule_id: "sch1", date: "2026-10-12" }),
    ]);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe("class-session");
    expect(events[0].title).toBe("ReactJS K12: Buổi 1");
    expect(format(new Date(events[0].startTime), "yyyy-MM-dd HH:mm")).toBe("2026-10-05 19:00");
    expect(hhmm(events[0].endTime)).toBe("20:30");
  });

  it("nhận cả giờ dạng timestamp ISO (backend cũ) và bỏ mục không đọc được giờ", () => {
    const events = timetableEntriesToEvents([
      entry({ schedule_id: "a", start_time: "2026-09-02T19:00:00+07:00", end_time: "2026-09-02T21:00:00+07:00" }),
      entry({ schedule_id: "b", start_time: "rác", end_time: "21:00" }),
    ]);
    expect(events).toHaveLength(1);
    expect(events[0].weekly?.startTime).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("visibleDateRange", () => {
  it("end loại trừ của FullCalendar thành ngày cuối gồm cả hai đầu", () => {
    expect(visibleDateRange(new Date(2026, 9, 5), new Date(2026, 9, 12))).toEqual({ from: "2026-10-05", to: "2026-10-11" });
  });
});
