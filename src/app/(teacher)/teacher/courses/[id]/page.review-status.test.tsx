/**
 * Phase 3 — trang quản lý khoá của giáo viên KHÔNG còn tự "Xuất bản".
 *
 * Backend chặn PUT /courses/:id {status:"published"} (400 COURSE_STATUS_CHANGE_NOT_ALLOWED);
 * nếu ai đó khôi phục nút "Xuất bản" cũ, giáo viên bấm là lỗi — test này bắt lại hồi quy đó:
 * khoá nháp phải có "Gửi duyệt" gọi submit-review, KHÔNG gọi updateCourse với status published.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "course-1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

const OWNER_ID = "teacher-owner-uuid";
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { user?: { id: string }; activeRole?: string }) => unknown) =>
    selector({ user: { id: OWNER_ID }, activeRole: "TEACHER" }),
}));

let mockCourse: Record<string, unknown> | undefined;
const mockUpdateCourse = vi.fn();
const mockSubmitReview = vi.fn();

vi.mock("@/hooks/queries/use-courses", () => ({
  useCourse: () => ({ data: mockCourse, isLoading: false }),
  useUpdateCourse: () => ({ mutate: mockUpdateCourse, isPending: false }),
}));

vi.mock("@/hooks/queries/use-course-approval", () => ({
  useSubmitCourseReview: () => ({ mutate: mockSubmitReview, isPending: false }),
}));

vi.mock("@/hooks/queries/use-sections", () => ({
  useSections: () => ({ data: [], isLoading: false }),
  useCreateSection: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderSections: () => ({ mutate: vi.fn() }),
  useDeleteSection: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/queries/use-lessons", () => ({
  useLessons: () => ({ data: [], isLoading: false }),
  useCreateLesson: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderLessons: () => ({ mutate: vi.fn() }),
  useDeleteLesson: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/queries/use-lesson-content", () => ({
  useLessonContents: () => ({ data: [], isLoading: false }),
  useCreateLessonContent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteLessonContent: () => ({ mutate: vi.fn() }),
  lessonContentKeys: { contents: (id: string) => ["lesson-content", id] },
}));

vi.mock("@/hooks/queries/use-live-sessions", () => ({
  useCreateLiveSession: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/queries/use-classes", () => ({
  useClasses: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));

vi.mock("@/components/teacher/add-content-modal", () => ({
  AddContentModal: () => null,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCourseDetailPage from "./page";

function setCourse(overrides: Record<string, unknown>) {
  mockCourse = {
    id: "course-1",
    title: "Khóa test",
    instructor_id: OWNER_ID,
    status: "draft",
    ...overrides,
  };
}

describe("/teacher/courses/[id] — gửi duyệt thay cho tự xuất bản (Phase 3)", () => {
  beforeEach(() => {
    mockUpdateCourse.mockReset();
    mockSubmitReview.mockReset();
  });

  it("khoá nháp: có 'Gửi duyệt' gọi submit-review, không còn 'Xuất bản', không PUT status published", () => {
    setCourse({ status: "draft" });
    render(<TeacherCourseDetailPage />);

    expect(screen.queryByRole("button", { name: "Xuất bản" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Gửi duyệt" }));

    expect(mockSubmitReview).toHaveBeenCalledTimes(1);
    expect(mockSubmitReview).toHaveBeenCalledWith("course-1");
    expect(mockUpdateCourse).not.toHaveBeenCalled();
  });

  it("khoá bị từ chối: banner đỏ hiện lý do + 'Gửi duyệt lại' gọi submit-review", () => {
    setCourse({ status: "rejected", rejection_reason: "Thiếu video bài 2, mô tả sơ sài" });
    render(<TeacherCourseDetailPage />);

    expect(screen.getByTestId("course-rejected-banner")).toBeTruthy();
    expect(screen.getByText("Thiếu video bài 2, mô tả sơ sài")).toBeTruthy();
    expect(screen.getByText("Bị từ chối")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Gửi duyệt lại" }));
    expect(mockSubmitReview).toHaveBeenCalledWith("course-1");
    expect(mockUpdateCourse).not.toHaveBeenCalled();
  });

  it("khoá chờ duyệt: banner 'Đang chờ quản trị viên duyệt', không có nút gửi", () => {
    setCourse({ status: "pending_review" });
    render(<TeacherCourseDetailPage />);

    expect(screen.getByText(/Đang chờ quản trị viên duyệt/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Gửi duyệt" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Gửi duyệt lại" })).toBeNull();
  });

  it("khoá đã xuất bản: badge 'Đã xuất bản', không banner/nút gửi duyệt", () => {
    setCourse({ status: "published" });
    render(<TeacherCourseDetailPage />);

    expect(screen.getByText("Đã xuất bản")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Gửi duyệt" })).toBeNull();
    expect(screen.queryByTestId("course-rejected-banner")).toBeNull();
  });
});
