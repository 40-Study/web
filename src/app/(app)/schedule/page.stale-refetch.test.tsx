/**
 * Q10 #148 H1/M3: /schedule còn lịch cache mà refetch nền lỗi: giữ lịch + MỘT thông báo 'Thử lại' cho cả hai nguồn
 * (thời khoá biểu + buổi live), trước đây im lặng. Nguồn lỗi lần đầu vẫn là dòng 'Chưa tải được đầy đủ lịch học'.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetchTimetable = vi.fn(async () => undefined);
const refetchLive = vi.fn(async () => undefined);
type Q = { data: unknown; isError: boolean };
let timetable: Q;
let live: Q;

vi.mock("@/hooks/queries/use-class-schedule", () => ({
  useMyTimetableEntries: () => ({ ...timetable, isLoading: false, refetch: refetchTimetable }),
}));
vi.mock("@/hooks/queries/use-live-sessions", () => ({ useLiveSessions: () => ({ ...live, refetch: refetchLive }) }));
vi.mock("@/components/schedule/week-calendar-grid", () => ({ default: () => <div data-testid="grid" /> }));
vi.mock("@/components/schedule/schedule-event-detail-dialog", () => ({ default: () => null }));

import SchedulePage from "./page";

const TIMETABLE = { entries: [], cancelled: [] };

beforeEach(() => {
  refetchTimetable.mockClear();
  refetchLive.mockClear();
  timetable = { data: TIMETABLE, isError: false };
  live = { data: { sessions: [] }, isError: false };
});

describe("/schedule — Q10 #148", () => {
  it("không lỗi: không có thông báo", () => {
    render(<SchedulePage />);
    expect(screen.queryByText(/Không làm mới được/)).toBeNull();
  });

  it("H1: thời khoá biểu refetch lỗi mà còn cache: giữ lịch + thông báo, 'Thử lại' chỉ làm mới nguồn lỗi", () => {
    timetable = { data: TIMETABLE, isError: true };
    render(<SchedulePage />);
    expect(screen.getByTestId("grid")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được lịch học");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchTimetable).toHaveBeenCalledTimes(1);
    expect(refetchLive).not.toHaveBeenCalled();
  });

  it("M3: cả hai nguồn cùng lỗi mà còn cache: MỘT thông báo, làm mới cả hai", () => {
    timetable = { data: TIMETABLE, isError: true };
    live = { data: { sessions: [] }, isError: true };
    render(<SchedulePage />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchTimetable).toHaveBeenCalledTimes(1);
    expect(refetchLive).toHaveBeenCalledTimes(1);
  });

  it("nguồn lỗi LẦN ĐẦU (chưa có data): giữ dòng lỗi cũ, không giả làm dữ liệu cũ", () => {
    timetable = { data: undefined, isError: true };
    render(<SchedulePage />);
    expect(screen.getByRole("alert").textContent).toContain("Chưa tải được đầy đủ lịch học");
    expect(screen.queryByText(/Không làm mới được/)).toBeNull();
  });
});
