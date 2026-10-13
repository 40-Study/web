/**
 * Wave-2 W2-3 (contract-be1 Q2-01): admin cũng xoá được khoá; khoá còn học viên ghi danh trả
 * 409 COURSE_HAS_ENROLLMENTS và UI phải nói rõ bằng tiếng Việt + gợi ý "Lưu trữ" (cùng hook với phía giáo viên).
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ApiError } from "@/lib/errors";
import { courseService } from "@/services/course.service";
import { renderWithQuery } from "@/test-utils/query-wrapper";
import type { AdminCourseItem } from "@/types/approval";

const mockUseAdminCourses = vi.fn();

vi.mock("@/hooks/queries/use-course-approval", () => ({
  useAdminCourses: (...args: unknown[]) => mockUseAdminCourses(...args),
  useApproveCourse: () => ({ mutate: vi.fn(), isPending: false }),
  useRejectCourse: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/components/admin/course-review-detail-dialog", () => ({ CourseReviewDetailDialog: () => null }));
vi.mock("@/services/course.service", () => ({
  courseService: { deleteCourse: vi.fn(), updateCourse: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let permissions = ["SYSTEM_SETTINGS_MANAGE"];
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { permissions: string[]; sessionStatus: string }) => unknown) =>
    selector({ permissions, sessionStatus: "authenticated" }),
}));

// eslint-disable-next-line import/first
import AdminCoursesPage from "./page";

function course(overrides: Partial<AdminCourseItem> = {}): AdminCourseItem {
  return {
    id: "course-1",
    title: "Đại số 10",
    status: "published",
    instructor_name: "Nguyễn Văn A",
    instructor_email: "teacher1@fortex.vn",
    created_at: "2026-09-01T00:00:00Z",
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

async function confirmDelete() {
  fireEvent.click(await screen.findByTestId("course-delete"));
  fireEvent.click(await screen.findByRole("button", { name: "Xoá khoá học" }));
}

describe("/admin/courses — xoá khoá học", () => {
  beforeEach(() => {
    permissions = ["SYSTEM_SETTINGS_MANAGE"];
    mockUseAdminCourses.mockReset();
    vi.mocked(courseService.deleteCourse).mockReset();
    vi.mocked(courseService.updateCourse).mockReset();
    vi.mocked(toast.error).mockReset();
    vi.mocked(toast.success).mockReset();
  });

  it("xoá phải qua hộp xác nhận rồi mới gọi API đúng id", async () => {
    withCourses([course()]);
    vi.mocked(courseService.deleteCourse).mockResolvedValue(undefined as never);
    renderWithQuery(<AdminCoursesPage />);

    fireEvent.click(await screen.findByTestId("course-delete"));
    expect(courseService.deleteCourse).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Xoá khoá học" }));

    await waitFor(() => expect(courseService.deleteCourse).toHaveBeenCalledWith("course-1"));
  });

  it("xoá xong làm mới danh sách admin (khoá query riêng 'admin-courses')", async () => {
    withCourses([course()]);
    vi.mocked(courseService.deleteCourse).mockResolvedValue(undefined as never);
    const { client } = renderWithQuery(<AdminCoursesPage />);
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await confirmDelete();

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin-courses"] });
  });

  it("409 COURSE_HAS_ENROLLMENTS: toast tiếng Việt kèm nút 'Lưu trữ'", async () => {
    withCourses([course()]);
    vi.mocked(courseService.deleteCourse).mockRejectedValue(
      new ApiError(409, "COURSE_HAS_ENROLLMENTS", "Course has active enrollments")
    );
    renderWithQuery(<AdminCoursesPage />);

    await confirmDelete();

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    const [message, options] = vi.mocked(toast.error).mock.calls[0] as [string, { action?: { label: string } }];
    expect(message).toMatch(/học viên/);
    expect(options.action?.label).toBe("Lưu trữ");
  });

  it("thiếu quyền quản trị hệ thống: không có nút xoá", () => {
    permissions = ["COURSES_APPROVE_ALL"];
    withCourses([course()]);
    renderWithQuery(<AdminCoursesPage />);
    expect(screen.queryByTestId("course-delete")).toBeNull();
  });

  it("khoá đang chờ duyệt: không có nút xoá (backend 409 COURSE_PENDING_REVIEW)", () => {
    withCourses([course({ status: "pending_review" })]);
    renderWithQuery(<AdminCoursesPage />);
    expect(screen.queryByTestId("course-delete")).toBeNull();
  });
});
