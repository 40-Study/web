/**
 * B-08/B-09: lịch giảng dạy phải thấy lịch lặp tuần và buổi học cụ thể của lớp, và vẽ đúng giờ kết thúc /
 * phòng đã lưu của buổi livestream (trước đây luôn +1 giờ).
 */

import { format } from "date-fns";
import { afterEach, describe, expect, it } from "vitest";
import type { LiveSession } from "@/services/live-session.service";
import type { TimetableEntry } from "@/types/class-schedule";
import {
  liveSessionToEvent,
  timetableEntriesToEvents,
  toVnWallClock,
  visibleDateRange,
  vnWallClockToIso,
} from "./teacher-schedule-events";

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

  it("không có khoảng ngày: buổi ngoài lịch thành sự kiện một lần; buổi sinh từ lịch lặp bị lược (lịch lặp đã vẽ), không hiện đôi", () => {
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

describe("timetableEntriesToEvents: có khoảng ngày (buổi đã sửa giờ / đã huỷ)", () => {
  const range = { from: "2026-10-05", to: "2026-10-25" }; // thứ Hai 05, 12, 19
  const weekly = entry({ schedule_id: "sch1", day_of_week: 1, effective_from: "2026-09-01", effective_until: "2026-12-31" });
  const days = (events: ReturnType<typeof timetableEntriesToEvents>) =>
    events.map((e) => format(new Date(e.startTime), "yyyy-MM-dd HH:mm"));

  it("trải lịch lặp thành từng thứ Hai trong khoảng, đúng giờ lặp", () => {
    const events = timetableEntriesToEvents([weekly], { range });
    expect(days(events)).toEqual(["2026-10-05 19:00", "2026-10-12 19:00", "2026-10-19 19:00"]);
    expect(events.every((e) => e.kind === "class-schedule")).toBe(true);
  });

  it("buổi sinh từ lịch lặp đã SỬA GIỜ hiện theo giờ thật, ngày đó không còn giờ lặp gốc", () => {
    const events = timetableEntriesToEvents(
      [weekly, entry({ session_id: "s2", schedule_id: "sch1", date: "2026-10-12", start_time: "14:00", end_time: "15:30" })],
      { range },
    );
    expect(days(events).sort()).toEqual(["2026-10-05 19:00", "2026-10-12 14:00", "2026-10-19 19:00"]);
    expect(events.find((e) => e.id === "class-session-s2")?.kind).toBe("class-session");
  });

  it("buổi sinh từ lịch lặp đã HUỶ biến mất khỏi lịch, không hiện theo giờ lặp gốc", () => {
    const events = timetableEntriesToEvents([weekly], { range, cancelled: [{ schedule_id: "sch1", date: "2026-10-12" }] });
    expect(days(events)).toEqual(["2026-10-05 19:00", "2026-10-19 19:00"]);
  });

  it("buổi DỜI sang ngày khác trong tuần: hiện ở ngày mới, ngày gốc (cùng tuần) không còn bóng giờ lặp", () => {
    // thứ Hai 12/10 dời sang thứ Tư 14/10: backend chỉ trả buổi ở ngày mới, không báo ngày gốc.
    const events = timetableEntriesToEvents(
      [weekly, entry({ session_id: "s2", schedule_id: "sch1", date: "2026-10-14", day_of_week: 3, start_time: "19:00", end_time: "21:00" })],
      { range },
    );
    expect(days(events).sort()).toEqual(["2026-10-05 19:00", "2026-10-14 19:00", "2026-10-19 19:00"]);
  });

  it("buổi sinh từ lịch lặp ở đúng thứ của lịch (chỉ đổi giờ) không làm mất buổi của tuần khác", () => {
    const events = timetableEntriesToEvents(
      [weekly, entry({ session_id: "s2", schedule_id: "sch1", date: "2026-10-12", day_of_week: 1, start_time: "14:00", end_time: "15:30" })],
      { range },
    );
    expect(days(events).sort()).toEqual(["2026-10-05 19:00", "2026-10-12 14:00", "2026-10-19 19:00"]);
  });

  it("lịch lặp ngoài hiệu lực hoặc khác thứ không vẽ", () => {
    expect(timetableEntriesToEvents([{ ...weekly, effective_until: "2026-10-10" }], { range })).toHaveLength(1);
    expect(timetableEntriesToEvents([{ ...weekly, effective_from: "2026-10-20" }], { range })).toHaveLength(0);
    expect(timetableEntriesToEvents([{ ...weekly, day_of_week: 3 }], { range })).toHaveLength(3); // thứ Tư 07, 14, 21
  });
});

describe("giờ Việt Nam bất kể múi giờ trình duyệt", () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it("livestream 14:00 giờ VN hiện 14:00 ở máy UTC và máy New York, như buổi lớp 'HH:MM'", () => {
    for (const tz of ["UTC", "America/New_York", "Asia/Ho_Chi_Minh"]) {
      process.env.TZ = tz;
      const ev = liveSessionToEvent(
        live({ scheduled_at: "2026-10-05T14:00:00+07:00", scheduled_end_at: "2026-10-05T15:30:00+07:00" }),
      );
      expect(format(new Date(ev.startTime), "yyyy-MM-dd HH:mm"), tz).toBe("2026-10-05 14:00");
      expect(format(new Date(ev.endTime), "HH:mm"), tz).toBe("15:30");
    }
  });

  it("gửi lên backend: giờ nhập trên form được ghi lại là giờ VN (+07:00), không theo múi giờ máy", () => {
    for (const tz of ["UTC", "America/New_York", "Asia/Ho_Chi_Minh"]) {
      process.env.TZ = tz;
      expect(vnWallClockToIso(new Date(2026, 9, 5, 14, 0, 0)), tz).toBe("2026-10-05T14:00:00+07:00");
    }
  });

  it("toVnWallClock là nghịch đảo của vnWallClockToIso", () => {
    process.env.TZ = "America/New_York";
    const instant = new Date("2026-10-05T14:00:00+07:00");
    expect(new Date(vnWallClockToIso(toVnWallClock(instant))).getTime()).toBe(instant.getTime());
  });
});

describe("visibleDateRange", () => {
  it("end loại trừ của FullCalendar thành ngày cuối gồm cả hai đầu", () => {
    expect(visibleDateRange(new Date(2026, 9, 5), new Date(2026, 9, 12))).toEqual({ from: "2026-10-05", to: "2026-10-11" });
  });
});
