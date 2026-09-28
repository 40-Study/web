/**
 * /teacher/courses/[id]/edit (QA vòng 2 D1 + Q5; review PR #79, W6): khoá đang chờ duyệt KHÔNG
 * hiện form sửa, chỉ hiện hướng dẫn + "Rút yêu cầu duyệt"; khoá nháp của chính mình hiện form;
 * khoá của giảng viên khác không hiện form.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const OWNER_ID = "teacher-1";
let mockCourse: Record<string, unknown> | undefined;
const mockWithdraw = vi.fn();

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "course-1" }) }));
vi.mock("@/hooks/queries/use-courses", () => ({
  useCourse: () => ({ data: mockCourse, isLoading: false, isError: false }),
}));
vi.mock("@/hooks/queries/use-course-approval", () => ({
  useWithdrawCourseReview: () => ({ mutate: mockWithdraw, isPending: false }),
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ user: { id: OWNER_ID }, activeRole: "TEACHER" }),
}));
// Form thật kéo theo upload/category hooks — chỉ cần biết form có được dựng hay không.
vi.mock("../../_components/course-edit-form", () => ({
  CourseEditForm: () => <div data-testid="course-edit-form" />,
}));

// eslint-disable-next-line import/first
import EditCoursePage from "./page";

const course = (over: Record<string, unknown>) => ({
  id: "course-1",
  title: "QA-Khoa",
  instructor_id: OWNER_ID,
  status: "draft",
  ...over,
});

describe("/teacher/courses/[id]/edit", () => {
  beforeEach(() => mockWithdraw.mockReset());

  it("khoá chờ duyệt: không có form, có banner + 'Rút yêu cầu duyệt' gọi đúng khoá", () => {
    mockCourse = course({ status: "pending_review" });
    render(<EditCoursePage />);
    expect(screen.queryByTestId("course-edit-form")).toBeNull();
    expect(screen.getByTestId("edit-locked-pending")).toBeTruthy();
    fireEvent.click(screen.getByTestId("withdraw-review"));
    expect(mockWithdraw).toHaveBeenCalledWith("course-1");
  });

  it("khoá nháp của mình: hiện form sửa", () => {
    mockCourse = course({ status: "draft" });
    render(<EditCoursePage />);
    expect(screen.getByTestId("course-edit-form")).toBeTruthy();
    expect(screen.queryByTestId("edit-locked-pending")).toBeNull();
  });

  it("khoá của giảng viên khác: không hiện form", () => {
    mockCourse = course({ instructor_id: "teacher-2" });
    render(<EditCoursePage />);
    expect(screen.queryByTestId("course-edit-form")).toBeNull();
    expect(screen.getByText("Không có quyền truy cập")).toBeTruthy();
  });
});
