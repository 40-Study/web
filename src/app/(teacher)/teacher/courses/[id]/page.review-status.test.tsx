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
const mockWithdrawReview = vi.fn();
// Mặc định khoá có 1 chương / 1 bài: khoá rỗng bị khoá nút gửi duyệt (D2), xem test riêng bên dưới.
const ONE_LESSON_SECTIONS = [{ id: "sec-1", title: "QA-Chuong 1", order: 1, lessons: [{ id: "les-1", title: "QA-Bai 1", order: 1 }] }];
let mockSections: unknown[] = ONE_LESSON_SECTIONS;

vi.mock("@/hooks/queries/use-courses", () => ({
  useCourse: () => ({ data: mockCourse, isLoading: false }),
  useUpdateCourse: () => ({ mutate: mockUpdateCourse, isPending: false }),
}));

vi.mock("@/hooks/queries/use-course-approval", () => ({
  useSubmitCourseReview: () => ({ mutate: mockSubmitReview, isPending: false }),
  useWithdrawCourseReview: () => ({ mutate: mockWithdrawReview, isPending: false }),
}));

vi.mock("@/hooks/queries/use-sections", () => ({
  useSections: () => ({ data: mockSections, isLoading: false }),
  sectionKeys: { byCourse: (id: string) => ["sections", id] },
  useCreateSection: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderSections: () => ({ mutate: vi.fn() }),
  useDeleteSection: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/queries/use-lessons", () => ({
  useLessons: () => ({ data: [{ id: "les-1", title: "QA-Bai 1", order: 1 }], isLoading: false }),
  useCreateLesson: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderLessons: () => ({ mutate: vi.fn() }),
  useDeleteLesson: () => ({ mutate: vi.fn() }),
}));

// 1 nội dung trong bài: test W4b/W4c mở bài ra để kiểm nút sửa/xoá/thêm nội dung.
const ONE_CONTENT = [{ id: "ct-1", lesson_id: "les-1", title: "QA-Noi dung 1", type: "document", order: 1 }];
vi.mock("@/hooks/queries/use-lesson-content", () => ({
  useLessonContents: () => ({ data: ONE_CONTENT, isLoading: false }),
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
    mockWithdrawReview.mockReset();
    mockSections = ONE_LESSON_SECTIONS;
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

  it("khoá chờ duyệt (Q5): khoá sửa — không có nút sửa/thêm chương; \"Rút yêu cầu duyệt\" gọi withdraw-review", () => {
    setCourse({ status: "pending_review" });
    render(<TeacherCourseDetailPage />);

    expect(screen.queryByTestId("edit-course-info")).toBeNull();
    expect(screen.queryByRole("button", { name: /Thêm chương/ })).toBeNull();
    // readOnly (review PR #79, W4): không còn nút kéo/xoá chương, bài, không "Thêm bài học".
    expect(screen.getByText("QA-Bai 1")).toBeTruthy();
    for (const name of [/Kéo để sắp xếp/, /Xoá chương/, /Xoá bài học/, /Thêm bài học/]) {
      expect(screen.queryAllByRole("button", { name })).toHaveLength(0);
    }
    fireEvent.click(screen.getByTestId("withdraw-review"));
    expect(mockWithdrawReview).toHaveBeenCalledWith("course-1");
  });

  // Re-review PR #79 (W4b/W4c): nội dung TRONG bài cũng phải chỉ đọc khi chờ duyệt — trước đây
  // bỏ readOnly ở LessonContentsPanel (hoặc bỏ điều kiện !readOnly) vẫn không test nào đỏ.
  it.each([
    ["pending_review", 0],
    ["draft", 1],
  ])("khoá %s: nút Chỉnh sửa/Xóa/Thêm nội dung trong bài có %i", (status, expected) => {
    setCourse({ status });
    render(<TeacherCourseDetailPage />);
    fireEvent.click(screen.getByText("QA-Bai 1"));
    expect(screen.getByText("QA-Noi dung 1")).toBeTruthy();
    expect(screen.queryAllByTitle("Chỉnh sửa")).toHaveLength(expected);
    expect(screen.queryAllByTitle("Xóa")).toHaveLength(expected);
    expect(screen.queryAllByRole("button", { name: /Thêm nội dung/ })).toHaveLength(expected);
  });

  it("khoá nháp 0 bài học (D2): nút Gửi duyệt bị tắt kèm hướng dẫn, bấm không gọi API", () => {
    mockSections = [{ id: "sec-1", title: "QA-Chuong rong", order: 1, lessons: [] }];
    setCourse({ status: "draft" });
    render(<TeacherCourseDetailPage />);

    const btn = screen.getByRole("button", { name: "Gửi duyệt" }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByTestId("submit-review-empty-hint")).toBeTruthy();
    fireEvent.click(btn);
    expect(mockSubmitReview).not.toHaveBeenCalled();
  });

  it("khoá nháp: có nút \"Sửa thông tin\" dẫn tới trang /edit (P1)", () => {
    setCourse({ status: "draft" });
    render(<TeacherCourseDetailPage />);
    expect(screen.getByTestId("edit-course-info")).toBeTruthy();
    // Đối chứng cho test readOnly: khoá nháp có đủ nút kéo/xoá chương và bài.
    for (const name of [/Kéo để sắp xếp chương/, /Xoá chương/, /Kéo để sắp xếp bài học/, /Xoá bài học/, /Thêm bài học/]) {
      expect(screen.queryAllByRole("button", { name }).length).toBeGreaterThan(0);
    }
  });

  it("khoá đã xuất bản: badge 'Đã xuất bản', không banner/nút gửi duyệt", () => {
    setCourse({ status: "published" });
    render(<TeacherCourseDetailPage />);

    expect(screen.getByText("Đã xuất bản")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Gửi duyệt" })).toBeNull();
    expect(screen.queryByTestId("course-rejected-banner")).toBeNull();
  });
});
