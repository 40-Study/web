/**
 * Q8-PG-05: các tab Khoá học / Điểm số / Lịch học / Bài tập chỉ đọc `isLoading`, nên API lỗi hiện thành "Chưa đăng ký khoá học
 * nào", bảng điểm chỉ có tiêu đề, lịch trống, "Chưa có bài tập nào": phụ huynh đọc sự cố thành "con tôi không có gì".
 * Mỗi tab phải nói "Không tải được ..." kèm "Thử lại" gọi lại đúng query của tab đó.
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
  courses: vi.fn(),
  grades: vi.fn(),
  timetable: vi.fn(),
  assignments: vi.fn(),
};
const failed = (name: keyof typeof refetch) => ({ data: undefined, isLoading: false, isError: true, refetch: refetch[name] });

vi.mock("@/hooks/queries/use-parent-dashboard", () => ({
  useChildOverview: () => ({
    isLoading: false,
    data: {
      id: "child-1", username: "be_an", full_name: "Bé An", relationship: "parent", total_xp: 120, current_streak: 3,
      enrolled_courses: 2, completed_courses: 1, total_study_minutes: 180,
      can_view_progress: true, can_view_grades: true, can_view_attendance: true,
    },
  }),
  useChildCourses: () => failed("courses"),
  useChildGrades: () => failed("grades"),
  useChildTimetable: () => failed("timetable"),
  useChildAttendance: () => ({ data: undefined, isLoading: false }),
  useChildAssignments: () => failed("assignments"),
}));

import ChildDetailPage from "./page";

beforeEach(() => Object.values(refetch).forEach((fn) => fn.mockReset()));

const cases: Array<[string, RegExp, RegExp, keyof typeof refetch]> = [
  ["Khoá học", /Không tải được danh sách khoá học/, /Chưa đăng ký khoá học nào/, "courses"],
  ["Điểm số", /Không tải được điểm số/, /Chưa có điểm nào/, "grades"],
  ["Lịch học", /Không tải được lịch học/, /Chưa có/, "timetable"],
  ["Bài tập", /Không tải được danh sách bài tập/, /Chưa có bài tập nào/, "assignments"],
];

describe("ChildDetailPage — tab lỗi API (Q8-PG-05)", () => {
  it.each(cases)("tab %s: hiện lỗi + Thử lại, không hiện trạng thái rỗng", (tab, errorText, emptyText, key) => {
    render(<ChildDetailPage />);
    fireEvent.click(screen.getByRole("tab", { name: new RegExp(tab) }));

    expect(screen.getByRole("alert").textContent).toMatch(errorText);
    expect(screen.queryByText(emptyText)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch[key]).toHaveBeenCalledTimes(1);
  });
});
