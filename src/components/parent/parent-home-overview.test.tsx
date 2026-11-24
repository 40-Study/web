/** N-04 + review web#123 #8: thẻ con ở /home liệt kê bài đã nộp chưa xong, quá hạn, dưới "Cần chú ý". */
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChildAssignment } from "@/services/parent-dashboard.service";

const base = { type: "code", difficulty: "easy", status: "in_progress", test_cases_passed: 0, total_test_cases: 0 };
const assignments: ChildAssignment[] = [
  { ...base, id: "a", title: "Bài sai", due_date: "2026-10-10T00:00:00Z", submission_count: 2, best_verdict: "wrong_answer" },
  { ...base, id: "b", title: "Top 5 sản phẩm", due_date: "2026-10-12T00:00:00Z", submission_count: 3, best_verdict: "system_error" },
];

vi.mock("@/hooks/queries/use-auth", () => ({
  useChildren: () => ({ data: { children: [{ id: "c1", username: "student1", full_name: "Lê Văn C" }] }, isLoading: false }),
}));
vi.mock("@/hooks/queries/use-parent-dashboard", () => ({
  useChildOverview: () => ({ data: undefined, isLoading: false }),
  useChildAssignments: () => ({ data: { assignments }, isLoading: false }),
  useChildAttendance: () => ({ data: { records: [] }, isLoading: false }),
}));

import { ParentHomeOverview } from "./parent-home-overview";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-04T10:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("ParentHomeOverview — mục 'Cần chú ý'", () => {
  it("liệt kê bài nộp chưa đạt và bài lỗi chấm đã quá hạn, nhãn đúng trạng thái", () => {
    render(<ParentHomeOverview />);
    const box = within(screen.getByTestId("retry-assignments"));
    expect(box.getByText("Cần chú ý (2)")).toBeTruthy();
    expect(box.getByText("Đã nộp, chưa đạt")).toBeTruthy();
    expect(box.getByText("Lỗi chấm, đang xử lý lại")).toBeTruthy();
    expect(screen.queryByText(/Cần làm lại/)).toBeNull();
  });
});
