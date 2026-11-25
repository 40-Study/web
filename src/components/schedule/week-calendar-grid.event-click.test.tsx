/**
 * Q6-PG-04: bấm một lần xuất hiện của lịch lặp tuần phải gửi đi buổi CỤ THỂ (không còn `weekly`), nếu không hộp
 * thoại bỏ qua việc tính "ĐÃ DIỄN RA" và mọi tuần đã qua đều ghi "SẮP DIỄN RA".
 * Q6-PG-08: tiêu đề "Lịch học" đổi được cấp thẻ để trang đã có h1 riêng không có hai h1.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WeekCalendarGrid, { type ScheduleEvent } from "./week-calendar-grid";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => vi.unstubAllGlobals());

const weeklyEvent: ScheduleEvent = {
  id: "w1", title: "Lớp Python tối", startTime: "2000-01-01T19:00:00.000Z", endTime: "2000-01-01T21:00:00.000Z",
  type: "video", status: "upcoming", kind: "class-session",
  weekly: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: "19:00", endTime: "21:00" },
};

describe("WeekCalendarGrid — bấm buổi lặp tuần", () => {
  it("gửi buổi cụ thể: không còn weekly, ngày là ngày thật (không phải 2000-01-01)", async () => {
    const onEventClick = vi.fn();
    render(<WeekCalendarGrid events={[weeklyEvent]} onEventClick={onEventClick} />);
    await waitFor(() => expect(screen.getAllByText("Lớp Python tối").length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText("Lớp Python tối")[0]);

    expect(onEventClick).toHaveBeenCalledTimes(1);
    const sent = onEventClick.mock.calls[0][0] as ScheduleEvent;
    expect(sent.weekly).toBeUndefined();
    expect(sent.startTime.startsWith("2000-")).toBe(false);
  });
});

describe("WeekCalendarGrid — cấp thẻ tiêu đề", () => {
  it("mặc định h1 (trang lịch không có h1 khác)", () => {
    render(<WeekCalendarGrid events={[]} />);
    expect(screen.getByRole("heading", { level: 1, name: "Lịch học" })).toBeTruthy();
  });
  it("headingLevel='h2': không có h1 nào từ lịch", () => {
    render(<WeekCalendarGrid events={[]} headingLevel="h2" />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Lịch học" })).toBeTruthy();
  });
});
