/** QA7 S7-06: trang lịch của học viên không gắn "Cá nhân" lên mọi buổi học của lớp. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ScheduleEvent } from "@/components/schedule/week-calendar-grid";

const grid = vi.hoisted(() => ({ events: [] as ScheduleEvent[] }));

vi.mock("@/hooks/queries/use-class-schedule", () => ({
  useMyTimetableEntries: () => ({
    data: {
      entries: [{ session_id: "s1", date: "2026-11-24", class_name: "ReactJS K12", class_id: "c1", day_of_week: 2, start_time: "19:00", end_time: "21:00", status: "scheduled" }],
      cancelled: [],
    },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock("@/hooks/queries/use-live-sessions", () => ({ useLiveSessions: () => ({ data: { sessions: [] }, isError: false }) }));
vi.mock("@/components/schedule/week-calendar-grid", () => ({
  default: (props: { events: ScheduleEvent[] }) => {
    grid.events = props.events;
    return <div data-testid="grid" />;
  },
}));
vi.mock("@/components/schedule/schedule-event-detail-dialog", () => ({ default: () => null }));

import SchedulePage from "./page";

describe("/schedule (học viên) — nhãn buổi học (S7-06)", () => {
  it("buổi lớp không có tag 'Cá nhân'", () => {
    render(<SchedulePage />);
    expect(screen.getByTestId("grid")).toBeTruthy();
    const classEvent = grid.events.find((e) => e.title.includes("ReactJS K12"));
    expect(classEvent).toBeDefined();
    expect(classEvent?.tag).toBeUndefined();
  });
});
