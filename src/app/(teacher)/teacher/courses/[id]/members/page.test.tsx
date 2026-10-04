/**
 * QA B-18: khoá không tồn tại / của giảng viên khác trước đây hiện bảng "Không có thành viên phù hợp" như thể khoá
 * chưa có ai. Phải từ chối rõ ràng, và tiêu đề không còn "Khóa học #<uuid>".
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import { ApiError } from "@/lib/errors";

const state = vi.hoisted(() => ({
  course: undefined as unknown,
  loading: false,
  error: undefined as unknown,
  refetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "course-1" }) }));
vi.mock("@/hooks/queries/use-courses", () => ({
  useCourse: () => ({
    data: state.course,
    isLoading: state.loading,
    isError: state.error !== undefined,
    error: state.error,
    refetch: state.refetch,
  }),
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
  state.error = undefined;
  state.refetch.mockReset();
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

  it("lỗi 5xx khi tải khoá: hiện lỗi + Thử lại (gọi refetch), không báo 'Không tìm thấy'", () => {
    state.error = new ApiError(500, "INTERNAL", "boom");
    render(<TeacherCourseMembersPage />);

    expect(screen.getByRole("heading", { name: "Không tải được khoá học" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Không tìm thấy khoá học" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(state.refetch).toHaveBeenCalledTimes(1);
  });

  it("API 403 khi tải khoá: hiện 'Không có quyền truy cập'", () => {
    state.error = new ApiError(403, "FORBIDDEN", "no");
    render(<TeacherCourseMembersPage />);

    expect(screen.getByRole("heading", { name: "Không có quyền truy cập" })).toBeTruthy();
  });

  it("store chưa có user: không nháy 'Không có quyền truy cập' (chờ)", () => {
    state.course = { id: "course-1", title: "React + Next.js", instructor_id: "t1" };
    useAuthStore.setState({ user: null as never, activeRole: "TEACHER" });
    render(<TeacherCourseMembersPage />);

    expect(screen.queryByRole("heading", { name: "Không có quyền truy cập" })).toBeNull();
    expect(screen.queryByText("Lê Văn C")).toBeNull();
  });

  it("refetch lỗi 5xx khi đã có dữ liệu: giữ nguyên trang và danh sách, chỉ hiện thông báo nhỏ + Thử lại", () => {
    state.course = { id: "course-1", title: "React + Next.js", instructor_id: "t1" };
    state.error = new ApiError(500, "INTERNAL", "boom");
    render(<TeacherCourseMembersPage />);

    expect(screen.queryByRole("heading", { name: "Không tải được khoá học" })).toBeNull();
    expect(screen.getByText("Lê Văn C")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(state.refetch).toHaveBeenCalledTimes(1);
  });
});
