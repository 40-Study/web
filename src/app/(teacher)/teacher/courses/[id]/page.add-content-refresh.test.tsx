/**
 * B-04 (QA hồi quy 03/10/2026): thêm video/bài tập vào bài học báo "Đã thêm" nhưng danh sách nội dung của
 * bài vẫn ghi "Chưa có nội dung" tới khi tải lại trang. Nguyên nhân: handleAddContent gọi thẳng
 * lessonContentService.createContent (không qua hook có invalidateQueries) nên cache query nội dung
 * của bài không bao giờ bị đánh dấu cũ.
 *
 * Test dựng lại đúng luồng người dùng: mở bài, bấm "Thêm nội dung", gửi form → phải làm mới đúng key
 * `lessonContentKeys.contents(<id bài>)`.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "course-1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

const mockInvalidate = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));

const OWNER_ID = "teacher-owner-uuid";
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { user?: { id: string }; activeRole?: string }) => unknown) =>
    selector({ user: { id: OWNER_ID }, activeRole: "TEACHER" }),
}));

vi.mock("@/hooks/queries/use-courses", () => ({
  useCourse: () => ({
    data: { id: "course-1", title: "Khóa test", instructor_id: OWNER_ID, status: "draft" },
    isLoading: false,
  }),
  useUpdateCourse: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/queries/use-course-approval", () => ({
  useSubmitCourseReview: () => ({ mutate: vi.fn(), isPending: false }),
  useWithdrawCourseReview: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/queries/use-sections", () => ({
  useSections: () => ({
    data: [{ id: "sec-1", title: "Chương 1", order: 1, lessons: [{ id: "les-1", title: "Bài 1", order: 1 }] }],
    isLoading: false,
  }),
  sectionKeys: { byCourse: (id: string) => ["sections", id] },
  useCreateSection: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderSections: () => ({ mutate: vi.fn() }),
  useDeleteSection: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/queries/use-lessons", () => ({
  useLessons: () => ({ data: [{ id: "les-1", title: "Bài 1", order: 1 }], isLoading: false }),
  useCreateLesson: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderLessons: () => ({ mutate: vi.fn() }),
  useDeleteLesson: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/queries/use-lesson-content", () => ({
  useLessonContents: () => ({ data: [], isLoading: false }),
  useCreateLessonContent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteLessonContent: () => ({ mutate: vi.fn() }),
  lessonContentKeys: { contents: (id: string) => ["lesson-content", "contents", id] },
}));

vi.mock("@/hooks/queries/use-live-sessions", () => ({
  useCreateLiveSession: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/queries/use-classes", () => ({
  useClasses: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));

const mockCreateContent = vi.fn();
vi.mock("@/services/lesson-content.service", () => ({
  lessonContentService: {
    createContent: (...args: unknown[]) => mockCreateContent(...args),
    getContents: vi.fn(),
    deleteContent: vi.fn(),
    updateContent: vi.fn(),
  },
}));

// Modal thật rất nặng; chỉ cần nút gửi một video hợp lệ khi modal đang mở.
vi.mock("@/components/teacher/add-content-modal", () => ({
  AddContentModal: ({ open, onSubmit }: { open: boolean; onSubmit: (d: unknown) => void }) =>
    open ? (
      <button
        type="button"
        onClick={() =>
          onSubmit({ type: "video", title: "Video mới", videoUrl: "https://youtu.be/abc", quizQuestions: [] })
        }
      >
        gui-video
      </button>
    ) : null,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCourseDetailPage from "./page";

describe("/teacher/courses/[id] — thêm nội dung làm mới danh sách ngay (B-04)", () => {
  beforeEach(() => {
    mockInvalidate.mockReset();
    mockCreateContent.mockReset();
    mockCreateContent.mockResolvedValue({ id: "ct-new" });
  });

  it("thêm video thành công thì invalidate nội dung của đúng bài học, không cần tải lại trang", async () => {
    render(<TeacherCourseDetailPage />);

    fireEvent.click(screen.getByText("Bài 1"));
    fireEvent.click(screen.getByRole("button", { name: /Thêm nội dung/ }));
    fireEvent.click(screen.getByRole("button", { name: "gui-video" }));

    await waitFor(() => expect(mockCreateContent).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["lesson-content", "contents", "les-1"] }),
    );
  });

  it("thêm thất bại thì KHÔNG làm mới (không có gì mới để hiển thị)", async () => {
    mockCreateContent.mockRejectedValue(new Error("boom"));
    render(<TeacherCourseDetailPage />);

    fireEvent.click(screen.getByText("Bài 1"));
    fireEvent.click(screen.getByRole("button", { name: /Thêm nội dung/ }));
    fireEvent.click(screen.getByRole("button", { name: "gui-video" }));

    await waitFor(() => expect(mockCreateContent).toHaveBeenCalledTimes(1));
    expect(mockInvalidate).not.toHaveBeenCalledWith({ queryKey: ["lesson-content", "contents", "les-1"] });
  });
});
