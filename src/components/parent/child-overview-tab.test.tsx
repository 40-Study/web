/**
 * P-02 (QA3 261104): "Bài tập sắp hạn" liệt kê bài đã quá hạn, cũ nhất trước, không đánh dấu.
 */
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChildAssignment, ChildOverview } from "@/services/parent-dashboard.service";
import { ChildOverviewTab } from "./child-overview-tab";

const overview = { can_view_progress: true, can_view_grades: true, can_view_attendance: true } as ChildOverview;

const make = (title: string, due: string): ChildAssignment => ({
  id: title,
  title,
  type: "code",
  difficulty: "easy",
  due_date: due,
  status: "in_progress",
  test_cases_passed: 0,
  total_test_cases: 0,
  submission_count: 0,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-04T10:00:00Z"));
});
afterEach(() => vi.useRealTimers());

const section = (name: RegExp) => screen.getByRole("heading", { name }).closest("section") as HTMLElement;

describe("ChildOverviewTab — bài tập theo hạn", () => {
  it("bài đã quá hạn nằm ở mục 'Quá hạn' có nhãn đỏ, không lẫn vào 'sắp hạn'", () => {
    render(
      <ChildOverviewTab
        overview={overview}
        courses={[]}
        attendance={[]}
        assignments={[
          make("Top 5 sản phẩm", "2026-10-12T00:00:00Z"),
          make("Mini project", "2026-10-14T00:00:00Z"),
          make("Bài sắp tới", "2026-11-10T00:00:00Z"),
        ]}
      />,
    );
    const upcoming = within(section(/Bài tập sắp hạn/));
    expect(upcoming.getByText("Bài sắp tới")).toBeTruthy();
    expect(upcoming.queryByText("Top 5 sản phẩm")).toBeNull();
    expect(upcoming.queryByText("Mini project")).toBeNull();

    const overdue = within(section(/Quá hạn \(2\)/));
    expect(overdue.getByText("Top 5 sản phẩm")).toBeTruthy();
    expect(overdue.getByText("Mini project")).toBeTruthy();
    expect(overdue.getAllByText(/^Quá hạn \d/)).toHaveLength(2);
  });

  it("toàn bài quá hạn: mục sắp hạn báo trống thay vì liệt kê bài cũ", () => {
    render(
      <ChildOverviewTab
        overview={overview}
        courses={[]}
        attendance={[]}
        assignments={[make("Cũ", "2026-10-01T00:00:00Z")]}
      />,
    );
    expect(within(section(/Bài tập sắp hạn/)).getByText("Không có bài tập nào sắp tới hạn.")).toBeTruthy();
  });

  it("không có bài quá hạn: không hiện mục 'Quá hạn'", () => {
    render(
      <ChildOverviewTab
        overview={overview}
        courses={[]}
        attendance={[]}
        assignments={[make("Sắp", "2026-11-09T00:00:00Z")]}
      />,
    );
    expect(screen.queryByRole("heading", { name: /Quá hạn/ })).toBeNull();
  });
});
