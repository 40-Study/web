/**
 * QA B-18: khoá không tồn tại / của giảng viên khác trước đây hiện bảng "Không có thành viên phù hợp" như thể khoá
 * chưa có ai. Phải từ chối rõ ràng, và tiêu đề không còn "Khóa học #<uuid>".
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";

const state = vi.hoisted(() => ({ course: undefined as unknown, loading: false }));

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "course-1" }) }));
vi.mock("@/hooks/queries/use-courses", () => ({
  useCourse: () => ({ data: state.course, isLoading: state.loading }),
}));
vi.mock("@/hooks/queries/use-classes", () => ({
  useMyStudents: () => ({
    data: [{ id: "s1", name: "Lê Văn C", student_id: "HV001", course_id: "course-1", course_name: "React + Next.js" }],
    isLoading: false,
  }),
}));
vi.mock("@/components/teacher/teacher-notification-dialog", () => ({ default: () => null }));

import TeacherCourseMembersPage from "./page";

beforeEach(() => {
  state.course = undefined;
  state.loading = false;
  useAuthStore.setState({ user: { id: "t1", name: "GV" } as never, activeRole: "TEACHER" });
});

describe("TeacherCourseMembersPage — quyền và tồn tại của khoá", () => {
  it("khoá không tồn tại (API 404): hiện 'Không tìm thấy khoá học', không có bảng thành viên", () => {
    render(<TeacherCourseMembersPage />);

    expect(screen.getByRole("heading", { name: "Không tìm thấy khoá học" })).toBeTruthy();
    expect(screen.queryByText("Không có thành viên phù hợp.")).toBeNull();
    expect(screen.getByRole("link", { name: "Về Khóa học của tôi" }).getAttribute("href")).toBe("/teacher/courses");
  });

  it("khoá của giảng viên khác: hiện 'Không có quyền truy cập', không lộ danh sách", () => {
    state.course = { id: "course-1", title: "Khoá của người khác", instructor_id: "t2" };
    render(<TeacherCourseMembersPage />);

    expect(screen.getByRole("heading", { name: "Không có quyền truy cập" })).toBeTruthy();
    expect(screen.queryByText("Lê Văn C")).toBeNull();
  });

  it("khoá của chính mình: hiện thành viên và tên khoá thật (không phải 'Khóa học #id')", () => {
    state.course = { id: "course-1", title: "React + Next.js", instructor_id: "t1" };
    render(<TeacherCourseMembersPage />);

    expect(screen.getByText("Lê Văn C")).toBeTruthy();
    expect(screen.getByText("React + Next.js")).toBeTruthy();
    expect(screen.queryByText(/Khóa học #/)).toBeNull();
  });
});