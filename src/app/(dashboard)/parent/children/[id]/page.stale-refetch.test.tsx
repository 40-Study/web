/**
 * Q10 #148 H1/M3: chi tiết con — tổng quan / khoá học / điểm / lịch / bài tập còn cache mà refetch nền lỗi: giữ nội dung ở mọi
 * tab và chỉ có MỘT thông báo 'Thử lại' cho cả trang (tab khoá học/bài tập không tự dựng thêm). Lần tải đầu lỗi (data
 * undefined) vẫn do hộp lỗi riêng của tab xử lý (page.tab-errors.test.tsx).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "child-1" }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { src: string; alt: string }) => <img src={props.src} alt={props.alt} />,
}));
vi.mock("@/components/parent/child-overview-tab", () => ({ ChildOverviewTab: () => null }));
vi.mock("@/components/parent/child-attendance-tab", () => ({ ChildAttendanceTab: () => null }));
vi.mock("@/hooks/queries/use-conversations", () => ({ useCreateDirectConversation: () => ({ mutate: vi.fn(), isPending: false }) }));

const refetch = {
  overview: vi.fn(async () => undefined),
  courses: vi.fn(async () => undefined),
  grades: vi.fn(async () => undefined),
  timetable: vi.fn(async () => undefined),
  assignments: vi.fn(async () => undefined),
};
let erroring = true;
const cached = (name: keyof typeof refetch, data: unknown) => ({ data, isLoading: false, isError: erroring, refetch: refetch[name] });

vi.mock("@/hooks/queries/use-parent-dashboard", () => ({
  useChildOverview: () => ({
    ...cached("overview", {
      id: "child-1", username: "be_an", full_name: "Bé An", relationship: "parent", total_xp: 120, current_streak: 3,
      enrolled_courses: 2, completed_courses: 1, total_study_minutes: 180,
      can_view_progress: true, can_view_grades: true, can_view_attendance: true,
    }),
    error: erroring ? new Error("boom") : null,
  }),
  useChildCourses: () => cached("courses", { courses: [{ id: "k1", course_name: "Khoá Toán", progress_percent: 40 }] }),
  useChildGrades: () => cached("grades", { grades: [] }),
  useChildTimetable: () => cached("timetable", { entries: [] }),
  useChildAttendance: () => ({ data: undefined, isLoading: false }),
  useChildAssignments: () => cached("assignments", { assignments: [], stats: undefined }),
}));

import ChildDetailPage from "./page";

beforeEach(() => {
  erroring = true;
  Object.values(refetch).forEach((fn) => fn.mockClear());
});

describe("ChildDetailPage — refetch nền lỗi mà còn cache (Q10 #148)", () => {
  it.each(["Khoá học", "Điểm số", "Lịch học", "Bài tập"])("tab %s: nội dung còn, đúng MỘT thông báo, không hộp lỗi", (tab) => {
    render(<ChildDetailPage />);
    fireEvent.click(screen.getByRole("tab", { name: new RegExp(tab) }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Thử lại" })).toHaveLength(1);
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được dữ liệu của con");
  });

  it("tab khoá học vẫn hiện khoá học đã cache", () => {
    render(<ChildDetailPage />);
    fireEvent.click(screen.getByRole("tab", { name: /Khoá học/ }));
    expect(screen.getByText("Khoá Toán")).toBeTruthy();
  });

  it("'Thử lại' làm mới mọi nguồn đang lỗi (mỗi nguồn đúng một lần)", () => {
    render(<ChildDetailPage />);
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    Object.values(refetch).forEach((fn) => expect(fn).toHaveBeenCalledTimes(1));
  });

  it("không lỗi: không có thông báo", () => {
    erroring = false;
    render(<ChildDetailPage />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
