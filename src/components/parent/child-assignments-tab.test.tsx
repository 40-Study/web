/**
 * QA-B-23: tab "Bài tập" của phụ huynh từng ghi "Đang làm" (vàng) cho mọi bài chưa hoàn thành, kể cả bài đã quá
 * hạn mà chưa nộp; bài đã nộp đang chờ chấm không được phân biệt. QA-B-26: "3/3 TC" khó hiểu.
 */
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChildAssignment, ChildAssignmentsResponse } from "@/services/parent-dashboard.service";
import { ChildAssignmentsTab } from "./child-assignments-tab";

const make = (title: string, due: string, extra: Partial<ChildAssignment> = {}): ChildAssignment => ({
  id: title,
  title,
  type: "code",
  difficulty: "easy",
  due_date: due,
  status: "not_started",
  test_cases_passed: 0,
  total_test_cases: 0,
  submission_count: 0,
  ...extra,
});

const data = (assignments: ChildAssignment[]): ChildAssignmentsResponse => ({
  assignments,
  stats: { total_assignments: assignments.length, completed: 1, in_progress: 1, not_started: 0, overdue: 1 },
  total: assignments.length,
  page: 1,
  page_size: 20,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-10T10:00:00Z"));
});
afterEach(() => vi.useRealTimers());

const row = (title: string) => within(screen.getByText(title).closest("li") as HTMLElement);

describe("ChildAssignmentsTab", () => {
  it("phân biệt quá hạn chưa nộp, đã nộp chờ chấm và hoàn thành", () => {
    render(
      <ChildAssignmentsTab
        isLoading={false}
        data={data([
          make("Top 5 sản phẩm", "2026-10-12T00:00:00Z", { status: "overdue" }),
          make("Mini project", "2026-10-07T16:59:00Z", {
            status: "in_progress",
            submission_count: 1,
            best_verdict: "pending",
          }),
          make("Form đăng ký", "2026-10-01T00:00:00Z", {
            status: "completed",
            submission_count: 2,
            best_verdict: "accepted",
            test_cases_passed: 3,
            total_test_cases: 3,
          }),
        ])}
      />,
    );
    expect(row("Top 5 sản phẩm").getByText("Quá hạn, chưa nộp")).toBeTruthy();
    expect(row("Mini project").getByText("Đã nộp, chờ chấm")).toBeTruthy();
    expect(row("Form đăng ký").getByText("Hoàn thành")).toBeTruthy();
    expect(row("Form đăng ký").getByText("Đạt 3/3 bài kiểm tra")).toBeTruthy();
    expect(screen.queryByText("Đang làm")).toBeNull();
    expect(screen.queryByText(/TC$/)).toBeNull();
  });
});
