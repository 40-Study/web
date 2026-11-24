/**
 * Q5-PG-08: hộp thoại chi tiết buổi học (phụ huynh xem lịch của con) ghi "SẮP DIỄN RA" cho buổi đã kết thúc hôm
 * qua và gắn chip "Video" cho mọi buổi học của lớp.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ScheduleEventDetailDialog from "./schedule-event-detail-dialog";
import type { ScheduleEvent } from "./week-calendar-grid";

const event = (over: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id: "e1",
  title: "ReactJS: Hooks",
  startTime: "2026-11-23T19:00:00.000Z",
  endTime: "2026-11-23T21:00:00.000Z",
  type: "video",
  status: "upcoming",
  kind: "class-session",
  ...over,
});

const show = (e: ScheduleEvent) => render(<ScheduleEventDetailDialog event={e} open onOpenChange={() => {}} />);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-24T10:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("ScheduleEventDetailDialog", () => {
  it("buổi đã kết thúc mà server vẫn để upcoming: ghi ĐÃ DIỄN RA", () => {
    show(event());
    expect(screen.getByText("ĐÃ DIỄN RA")).toBeTruthy();
    expect(screen.queryByText("SẮP DIỄN RA")).toBeNull();
  });

  it("buổi chưa kết thúc: vẫn SẮP DIỄN RA", () => {
    show(event({ startTime: "2026-11-25T19:00:00.000Z", endTime: "2026-11-25T21:00:00.000Z" }));
    expect(screen.getByText("SẮP DIỄN RA")).toBeTruthy();
  });

  it("lịch lặp tuần (ngày giả 2000-01-01) không bị coi là đã qua", () => {
    show(event({ startTime: "2000-01-01T19:00:00.000Z", endTime: "2000-01-01T21:00:00.000Z", weekly: { daysOfWeek: [1], startTime: "19:00", endTime: "21:00" } }));
    expect(screen.getByText("SẮP DIỄN RA")).toBeTruthy();
  });

  it("trạng thái completed giữ nguyên nhãn ĐÃ HOÀN THÀNH", () => {
    show(event({ status: "completed" }));
    expect(screen.getByText("ĐÃ HOÀN THÀNH")).toBeTruthy();
  });

  it("buổi học của lớp không có chip Video; livestream vẫn có chip loại", () => {
    const { unmount } = show(event());
    expect(screen.queryByText("Video")).toBeNull();
    unmount();
    show(event({ kind: "livestream", type: "livestream" }));
    expect(screen.getByText("Livestream")).toBeTruthy();
  });
});
