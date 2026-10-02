/**
 * Trang phụ huynh, tab "Điểm số": cột "Chấm bởi" phải hiện `graded_by_name` mà backend trả (giảng viên lớp hoặc
 * chủ/quản trị tổ chức), và "—" khi backend không nạp được tên. Trước đây không test nào ghim cột này: xoá hoặc
 * đổi tên field mà mọi test vẫn xanh.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "child-1" }),
  useRouter: () => ({ back: vi.fn() }),
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { src: string; alt: string }) => <img src={props.src} alt={props.alt} />,
}));
vi.mock("@/components/parent/child-overview-tab", () => ({ ChildOverviewTab: () => null }));
vi.mock("@/components/parent/child-courses-tab", () => ({ ChildCoursesTab: () => null }));

const grades = [
  {
    id: "g-1", class_id: "c-1", class_name: "Lớp Toán 9A", grade_type: "assignment", title: "Bài 1", score: 8, max_score: 10,
    percentage: 80, weight: 1, graded_by: "u-1", graded_by_name: "Nguyễn Chủ Tổ Chức", graded_at: "2026-10-01T09:00:00+07:00",
  },
  {
    id: "g-2", class_id: "c-1", class_name: "Lớp Toán 9A", grade_type: "quiz", title: "Bài 2", score: 5, max_score: 10,
    percentage: 50, weight: 1, graded_at: "2026-10-02T09:00:00+07:00",
  },
];

vi.mock("@/hooks/queries/use-parent-dashboard", () => {
  const idle = { data: undefined, isLoading: false };
  return {
    useChildOverview: () => ({
      isLoading: false,
      data: {
        id: "child-1", username: "be_an", full_name: "Bé An", relationship: "parent", total_xp: 120, current_streak: 3,
        enrolled_courses: 2, completed_courses: 1, total_study_minutes: 180,
        can_view_progress: true, can_view_grades: true, can_view_attendance: true,
      },
    }),
    useChildCourses: () => idle,
    useChildGrades: () => ({ isLoading: false, data: { grades, final_grades: [] } }),
    useChildTimetable: () => idle,
    useChildAttendance: () => idle,
    useChildAssignments: () => idle,
  };
});

import ChildDetailPage from "./page";

describe("ChildDetailPage — tab Điểm số", () => {
  it("cột 'Chấm bởi' hiện tên người chấm, và '—' khi không có tên", () => {
    render(<ChildDetailPage />);
    fireEvent.click(screen.getByRole("tab", { name: /Điểm số/ }));

    expect(screen.getByRole("columnheader", { name: "Chấm bởi" })).toBeTruthy();
    const rows = screen.getAllByRole("row");
    const first = within(rows.find((r) => within(r).queryByText("Bài 1"))!);
    expect(first.getByText("Nguyễn Chủ Tổ Chức")).toBeTruthy();
    const second = within(rows.find((r) => within(r).queryByText("Bài 2"))!);
    expect(second.getByText("—")).toBeTruthy();
  });
});