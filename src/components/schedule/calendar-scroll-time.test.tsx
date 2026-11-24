/**
 * QA-B-25: lịch luôn mở ở khung 07:00 trong khi các buổi đều 19:00, tuần trông như trống.
 * Lịch phải cuộn tới buổi sớm nhất trong khoảng đang xem, không có buổi thì tới giờ hiện tại.
 */
import { render, waitFor } from "@testing-library/react";
import { Calendar } from "@fullcalendar/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pickCalendarScrollTime } from "./calendar-scroll-time";
import WeekCalendarGrid, { type ScheduleEvent } from "./week-calendar-grid";

// Tuần 09/11 (T2) - 16/11/2026 theo giờ máy chạy test.
const WEEK = { start: new Date(2026, 10, 9), end: new Date(2026, 10, 16) };
const at = (day: number, h: number, m = 0) => new Date(2026, 10, day, h, m).toISOString();
const ev = (id: string, startTime: string, extra: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id, title: id, startTime, endTime: startTime, type: "livestream", status: "upcoming", ...extra,
});

describe("pickCalendarScrollTime", () => {
  it("cuộn tới buổi sớm nhất trong tuần (lùi 30 phút)", () => {
    const events = [ev("a", at(12, 19, 30)), ev("b", at(10, 19)), ev("c", at(20, 6))]; // c ngoài tuần
    expect(pickCalendarScrollTime(events, WEEK, new Date(2026, 10, 10, 9))).toBe("18:30:00");
  });

  it("lịch lặp tuần: tính theo giờ bắt đầu nếu có ngày trùng trong khoảng và còn hiệu lực", () => {
    const weekly = ev("w", "", { weekly: { daysOfWeek: [3], startTime: "19:00", endTime: "20:30" } });
    expect(pickCalendarScrollTime([weekly], WEEK)).toBe("18:30:00");
    const expired = ev("x", "", { weekly: { daysOfWeek: [3], startTime: "08:00", endTime: "09:00", endRecur: "2026-11-05" } });
    expect(pickCalendarScrollTime([expired, weekly], WEEK)).toBe("18:30:00");
  });

  // Q6-PG-18: một buổi lẻ 08:30 thứ Bảy kéo khung về 08:00, giấu 5 buổi 19:00 các ngày trong tuần.
  it("Q6-PG-18: cụm buổi tối đông hơn một buổi sáng lẻ -> cuộn tới cụm tối", () => {
    const weekly = ev("w", "", { weekly: { daysOfWeek: [1, 2, 3, 4, 5], startTime: "19:00", endTime: "21:30" } });
    const saturday = ev("sat", at(14, 8, 30));
    expect(pickCalendarScrollTime([weekly, saturday], WEEK, new Date(2026, 10, 12, 10))).toBe("18:30:00");
  });

  it("Q6-PG-18: hoà số buổi giữa hai khung -> khung sớm hơn", () => {
    expect(pickCalendarScrollTime([ev("a", at(10, 8, 30)), ev("b", at(11, 19))], WEEK)).toBe("08:00:00");
  });

  it("không có buổi, tuần đang xem chứa hôm nay: cuộn tới giờ hiện tại", () => {
    expect(pickCalendarScrollTime([], WEEK, new Date(2026, 10, 10, 20, 15))).toBe("19:45:00");
  });

  it("không có buổi, tuần khác: 07:00 như cũ", () => {
    expect(pickCalendarScrollTime([], WEEK, new Date(2026, 11, 1, 10))).toBe("07:00:00");
  });

  it("buổi lúc 00:10 không cuộn ra giờ âm", () => {
    expect(pickCalendarScrollTime([ev("a", at(11, 0, 10))], WEEK)).toBe("00:00:00");
  });
});

describe("WeekCalendarGrid — tự cuộn tới buổi đầu tiên", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("có buổi 19:00 hôm nay: gọi scrollToTime('18:30:00') thay vì đứng ở 07:00", async () => {
    // CalendarEventCard đo kích thước bằng ResizeObserver; jsdom không có.
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    // Bản thật cần ResizeObserver (jsdom không có): chỉ ghi nhận lời gọi.
    const scroll = vi.spyOn(Calendar.prototype, "scrollToTime").mockImplementation(() => {});
    const now = new Date();
    const today19 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19).toISOString();
    render(<WeekCalendarGrid events={[ev("evening", today19)]} />);
    await waitFor(() => expect(scroll).toHaveBeenCalledWith("18:30:00"));
  });
});
