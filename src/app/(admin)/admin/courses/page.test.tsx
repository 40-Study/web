/**
 * /admin/courses (Phase 3) — dialog từ chối bắt buộc lý do, gửi đúng {id, reason} đã trim;
 * duyệt đi qua dialog xác nhận; nút hành động ẩn khi thiếu COURSES_APPROVE_ALL.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminCourseItem } from "@/types/approval";

const mockUseAdminCourses = vi.fn();
const mockApprove = vi.fn();
const mockReject = vi.fn();

vi.mock("@/hooks/queries/use-course-approval", () => ({
  useAdminCourses: (...args: unknown[]) => mockUseAdminCourses(...args),
  useApproveCourse: () => ({ mutate: mockApprove, isPending: false }),
  useRejectCourse: () => ({ mutate: mockReject, isPending: false }),
}));

// Dialog chi tiết có query riêng — không mở trong test này.
vi.mock("@/components/admin/course-review-detail-dialog", () => ({
  CourseReviewDetailDialog: () => null,
}));

let authState = { permissions: ["COURSES_APPROVE_ALL"], sessionStatus: "authenticated" as const };
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

// eslint-disable-next-line import/first
import AdminCoursesPage from "./page";

function buildCourse(overrides: Partial<AdminCourseItem> = {}): AdminCourseItem {
  return {
    id: "course-1",
    title: "Toán 12 nâng cao",
    status: "pending_review",
    submitted_at: "2026-09-28T01:00:00Z",
    instructor_name: "Nguyễn Văn A",
    instructor_email: "teacher1@fortex.vn",
    ...overrides,
  };
}

function withCourses(courses: AdminCourseItem[]) {
  mockUseAdminCourses.mockReturnValue({
    data: { courses, total: courses.length, page: 1, page_size: 20 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
}

describe("/admin/courses — duyệt khoá học", () => {
  beforeEach(() => {
    mockUseAdminCourses.mockReset();
    mockApprove.mockReset();
    mockReject.mockReset();
    authState = { permissions: ["COURSES_APPROVE_ALL"], sessionStatus: "authenticated" };
  });

  it("mặc định lọc 'Chờ duyệt' (status=pending_review) và hiện tên + email giáo viên", () => {
    withCourses([buildCourse()]);
    render(<AdminCoursesPage />);

    expect(mockUseAdminCourses).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending_review", page: 1 })
    );
    expect(screen.getByText("Toán 12 nâng cao")).toBeTruthy();
    expect(screen.getByText("teacher1@fortex.vn")).toBeTruthy();
  });

  it("dialog từ chối: nút gửi disabled khi lý do rỗng/chỉ khoảng trắng, KHÔNG gọi mutate", () => {
    withCourses([buildCourse()]);
    render(<AdminCoursesPage />);

    fireEvent.click(screen.getByTestId("course-reject"));
    const submit = screen.getByTestId("reject-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.change(screen.getByTestId("reject-reason"), { target: { value: "    " } });
    expect(submit.disabled).toBe(true);
    fireEvent.click(submit);
    expect(mockReject).not.toHaveBeenCalled();
  });

  it("dialog từ chối: gửi đúng {id, reason} đã trim", () => {
    withCourses([buildCourse()]);
    render(<AdminCoursesPage />);

    fireEvent.click(screen.getByTestId("course-reject"));
    fireEvent.change(screen.getByTestId("reject-reason"), {
      target: { value: "  Thiếu nội dung chương 2  " },
    });
    fireEvent.click(screen.getByTestId("reject-submit"));

    expect(mockReject).toHaveBeenCalledTimes(1);
    expect(mockReject.mock.calls[0][0]).toEqual({ id: "course-1", reason: "Thiếu nội dung chương 2" });
  });

  it("duyệt: phải qua dialog xác nhận rồi mới gọi approve với đúng id", () => {
    withCourses([buildCourse()]);
    render(<AdminCoursesPage />);

    fireEvent.click(screen.getByTestId("course-approve"));
    expect(mockApprove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("approve-confirm"));

    expect(mockApprove).toHaveBeenCalledTimes(1);
    expect(mockApprove.mock.calls[0][0]).toBe("course-1");
  });

  it("thiếu COURSES_APPROVE_ALL: không có nút Duyệt/Từ chối", () => {
    authState = { permissions: [], sessionStatus: "authenticated" };
    withCourses([buildCourse()]);
    render(<AdminCoursesPage />);

    expect(screen.queryByTestId("course-approve")).toBeNull();
    expect(screen.queryByTestId("course-reject")).toBeNull();
  });

  it("danh sách rỗng: hiện thông báo không có khoá chờ duyệt", () => {
    withCourses([]);
    render(<AdminCoursesPage />);
    expect(screen.getByText("Hiện không có khoá học nào chờ duyệt.")).toBeTruthy();
  });
});
