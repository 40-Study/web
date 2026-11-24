/**
 * QA6 S6-06: thẻ bài đã nộp/đã chấm vẫn ghi "Quá hạn, còn nộp muộn" cạnh "Đã chấm 10/10", và nhãn trạng thái
 * bị bẻ thành hai dòng trong pill. Bài CHƯA nộp quá hạn vẫn phải nhắc còn nộp muộn được.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const end = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
const base = { description: "", language: ["python"], is_published: true, end_time: end, allow_late_submission: true, max_late_days: 7, grace_period_minutes: 0 };
const ASSIGNMENTS = [
  { ...base, id: "a-graded", title: "Bài đã chấm", my_submission: { id: "s1", status: "graded", score: 10, max_score: 10 } },
  { ...base, id: "a-late", title: "Bài chưa nộp" },
];

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: ASSIGNMENTS, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { user?: { id: string } }) => unknown) => selector({ user: { id: "student-1" } }),
}));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/services/livestream-classroom.service", () => ({
  livestreamClassroomService: { listSessions: vi.fn(), getAssignments: vi.fn() },
}));

// eslint-disable-next-line import/first
import MyAssignmentsPage from "./page";

describe("/my-assignments — bài đã nộp quá hạn", () => {
  it("chỉ bài chưa nộp mới ghi 'Quá hạn, còn nộp muộn'", () => {
    render(<MyAssignmentsPage />);
    expect(screen.getAllByText(/Quá hạn, còn nộp muộn/)).toHaveLength(1);
    const graded = screen.getByText("Bài đã chấm").closest("div.bg-white") as HTMLElement;
    expect(graded.textContent).toContain("Đã chấm 10/10");
    expect(graded.textContent).not.toContain("Quá hạn");
    expect(graded.textContent).toContain("Hạn:");
  });

  it("nhãn 'Đã chấm 10/10' không được bẻ dòng trong pill", () => {
    render(<MyAssignmentsPage />);
    const pill = screen.getByText("Đã chấm 10/10");
    expect(pill.className).toContain("whitespace-nowrap");
    expect(pill.className).toContain("shrink-0");
  });

  it("nút chuyển lưới/danh sách và phân trang có tên truy cập", () => {
    render(<MyAssignmentsPage />);
    expect(screen.getByRole("button", { name: "Xem dạng lưới" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Xem dạng danh sách" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Trang trước" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Trang sau" })).toBeTruthy();
  });
});
