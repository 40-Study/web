import { describe, expect, it } from "vitest";
import type { ScheduleEvent } from "@/components/schedule/week-calendar-grid";
import { summarizeVisibleTeaching } from "./schedule-stats";

const ev = (id: string, day: string, from: string, to: string, extra: Partial<ScheduleEvent> = {}): ScheduleEvent =>
  ({
    id,
    title: id,
    startTime: new Date(`${day}T${from}:00`).toISOString(),
    endTime: new Date(`${day}T${to}:00`).toISOString(),
    type: "video",
    status: "upcoming",
    ...extra,
  }) as ScheduleEvent;

const WEEK = { from: "2026-11-09", to: "2026-11-15" };

describe("summarizeVisibleTeaching (QA-B-13)", () => {
  it("chỉ đếm buổi trong tuần đang xem, không cộng livestream của tuần khác", () => {
    const events = [
      ev("react-1", "2026-11-10", "19:00", "21:00", { kind: "class-schedule" }),
      ev("react-2", "2026-11-12", "19:00", "21:00", { kind: "class-schedule" }),
      ev("react-3", "2026-11-14", "19:00", "21:00", { kind: "class-schedule" }),
      ev("flutter", "2026-11-14", "13:00", "16:00", { kind: "class-session" }),
      ev("live-cu", "2026-10-20", "19:00", "22:00", { kind: "livestream" }),
      ev("live-sau", "2026-11-20", "19:00", "21:30", { kind: "livestream" }),
    ];
    expect(summarizeVisibleTeaching(events, WEEK)).toEqual({ sessions: 4, hours: 9 });
  });

  it("không đếm mẫu lịch lặp tuần (đại diện cho nhiều tuần)", () => {
    const weekly = ev("mau", "2000-01-01", "19:00", "21:00", {
      kind: "class-schedule",
      weekly: { daysOfWeek: [2], startTime: "19:00", endTime: "21:00" },
    });
    expect(summarizeVisibleTeaching([weekly], { from: "1999-12-27", to: "2000-01-02" })).toEqual({
      sessions: 0,
      hours: 0,
    });
  });

  it("chưa biết khoảng đang xem thì chưa đếm", () => {
    expect(summarizeVisibleTeaching([ev("a", "2026-11-10", "19:00", "21:00")], undefined)).toEqual({
      sessions: 0,
      hours: 0,
    });
  });

  it("làm tròn tới nửa giờ", () => {
    expect(summarizeVisibleTeaching([ev("a", "2026-11-10", "19:00", "20:30")], WEEK).hours).toBe(1.5);
  });
});
