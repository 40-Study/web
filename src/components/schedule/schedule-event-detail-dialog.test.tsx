/**
 * Q5-PG-08: hộp thoại chi tiết buổi học (phụ huynh xem lịch của con) ghi "SẮP DIỄN RA" cho buổi đã kết thúc hôm
 * qua và gắn chip "Video" cho mọi buổi học của lớp.
 */
import { fireEvent, render, screen } from "@testing-library/react";
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

  // Round 2 (L3): huỷ buổi ngay từ popup lịch giảng viên, chỉ khi buổi CHƯA bắt đầu.
  describe("nút Huỷ buổi", () => {
    // "now" = 2026-11-24T10:00Z = 17:00 giờ VN.
    const target = (over = {}) => ({ classId: "c1", sessionId: "s1", date: "2026-11-25", startTime: "19:00", ...over });
    const upcoming = (over: Partial<ScheduleEvent> = {}) =>
      event({ startTime: "2026-11-25T19:00:00.000Z", endTime: "2026-11-25T21:00:00.000Z", cancelTarget: target(), ...over });
    const showWith = (e: ScheduleEvent, onCancelSession?: (e: ScheduleEvent) => void) =>
      render(<ScheduleEventDetailDialog event={e} open onOpenChange={() => {}} onCancelSession={onCancelSession} />);

    it("buổi chưa bắt đầu + có handler: hiện nút và gọi handler với đúng buổi", () => {
      const onCancel = vi.fn();
      const e = upcoming();
      showWith(e, onCancel);
      fireEvent.click(screen.getByRole("button", { name: /Huỷ buổi/ }));
      expect(onCancel).toHaveBeenCalledWith(e);
    });

    it("không truyền handler (trang phụ huynh/học viên): không có nút", () => {
      showWith(upcoming());
      expect(screen.queryByRole("button", { name: /Huỷ buổi/ })).toBeNull();
    });

    it("buổi đã bắt đầu theo giờ VN (16:00 hôm nay, bây giờ là 17:00): không có nút", () => {
      showWith(upcoming({ cancelTarget: target({ date: "2026-11-24", startTime: "16:00" }) }), vi.fn());
      expect(screen.queryByRole("button", { name: /Huỷ buổi/ })).toBeNull();
    });

    it("không có cancelTarget (livestream, lịch lặp, buổi đã xong): không có nút", () => {
      showWith(upcoming({ cancelTarget: undefined }), vi.fn());
      expect(screen.queryByRole("button", { name: /Huỷ buổi/ })).toBeNull();
    });
  });
});
