/** QA7 S7-05: bài chấm thủ công (auto_grade=false) không chạy test nên thẻ không được ghi "Giới hạn Ns/test". */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const future = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
const base = { description: "", is_published: true, end_time: future, allow_late_submission: false, max_late_days: 0, grace_period_minutes: 0, time_limit: 2 };
const ASSIGNMENTS = [
  { ...base, id: "a-dart", title: "Bài Dart", language: ["dart"], auto_grade: false },
  { ...base, id: "a-py", title: "Bài Python", language: ["python"], auto_grade: true },
  { ...base, id: "a-old", title: "Bài backend cũ", language: ["python"] },
];

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: ASSIGNMENTS, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { user?: { id: string } }) => unknown) => selector({ user: { id: "student-1" } }),
}));
vi.mock("next/dynamic", () => ({ default: () => () => null }));

// eslint-disable-next-line import/first
import MyAssignmentsPage from "./page";

describe("/my-assignments — chấm thủ công (S7-05)", () => {
  it("chỉ bài tự chấm (và backend cũ không có auto_grade) mới ghi 'Giới hạn 2s/test'", () => {
    render(<MyAssignmentsPage />);
    expect(screen.getAllByText("Giới hạn 2s/test")).toHaveLength(2);
    const dart = screen.getByText("Bài Dart").closest("div.bg-white") as HTMLElement;
    expect(dart.textContent).not.toContain("Giới hạn");
  });
});
