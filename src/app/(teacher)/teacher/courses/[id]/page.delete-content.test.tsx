/**
 * Q4-T02: nút X cạnh nội dung bài học từng xoá ngay khi bấm. Nay phải hỏi lại trước khi gửi DELETE.
 * Q4-T20: các nút biểu tượng trên hàng nội dung có aria-label, nút quay lại là một link (không lồng nút trong link).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "course-1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

const OWNER_ID = "teacher-owner-uuid";
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { user?: { id: string }; activeRole?: string }) => unknown) =>
    selector({ user: { id: OWNER_ID }, activeRole: "TEACHER" }),
}));

let mockCourse: Record<string, unknown> = {};
vi.mock("@/hooks/queries/use-courses", () => ({
  useCourse: () => ({ data: mockCourse, isLoading: false }),
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
const deleteContentMutate = vi.fn();
const CONTENTS = [
  { id: "ct-quiz", lesson_id: "les-1", type: "quiz", title: "Kiểm tra Git", quiz_id: "quiz-9", is_mandatory: false, display_order: 1 },
  { id: "ct-art", lesson_id: "les-1", type: "article", title: "Bài đọc", display_order: 2 },
];
vi.mock("@/hooks/queries/use-lesson-content", () => ({
  useLessonContents: () => ({ data: CONTENTS, isLoading: false }),
  useCreateLessonContent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteLessonContent: () => ({ mutate: deleteContentMutate, isPending: false }),
  lessonContentKeys: { contents: (id: string) => ["lesson-content", id] },
}));
vi.mock("@/hooks/queries/use-live-sessions", () => ({
  useCreateLiveSession: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/queries/use-classes", () => ({
  useClasses: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));
vi.mock("@/components/teacher/add-content-modal", () => ({ AddContentModal: () => null }));
vi.mock("@/components/teacher/quiz-duplicate-button", () => ({
  QuizDuplicateButton: ({ lessonId, quizId, isMandatory }: { lessonId: string; quizId: string; isMandatory?: boolean }) => (
    <button type="button" title="Nhân bản bài trắc nghiệm" data-lesson={lessonId} data-quiz={quizId} data-mandatory={String(isMandatory)} />
  ),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCourseDetailPage from "./page";

function openLesson() {
  mockCourse = { id: "course-1", title: "Khoá test", instructor_id: OWNER_ID, status: "draft" };
  render(<TeacherCourseDetailPage />);
  fireEvent.click(screen.getByText("Bài 1"));
}

describe("/teacher/courses/[id] — xoá nội dung bài học (Q4-T02)", () => {
  beforeEach(() => deleteContentMutate.mockReset());

  it("bấm X chỉ mở hộp thoại xác nhận, chưa xoá", () => {
    openLesson();
    fireEvent.click(screen.getByRole("button", { name: "Xoá: Kiểm tra Git" }));
    expect(deleteContentMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Xoá bài trắc nghiệm?")).toBeTruthy();
    expect(screen.getByText(/cùng toàn bộ câu hỏi/)).toBeTruthy();
  });

  it("xác nhận mới gửi DELETE đúng nội dung", () => {
    openLesson();
    fireEvent.click(screen.getByRole("button", { name: "Xoá: Kiểm tra Git" }));
    fireEvent.click(screen.getByRole("button", { name: "Xoá nội dung" }));
    expect(deleteContentMutate).toHaveBeenCalledWith("ct-quiz", expect.anything());
  });

  it("huỷ thì không xoá", () => {
    openLesson();
    fireEvent.click(screen.getByRole("button", { name: "Xoá: Bài đọc" }));
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(deleteContentMutate).not.toHaveBeenCalled();
  });
});

describe("/teacher/courses/[id] — a11y (Q4-T20)", () => {
  it("nút quay lại là link có nhãn, không lồng button trong link", () => {
    openLesson();
    const back = screen.getByRole("link", { name: "Quay lại danh sách khoá học" });
    expect(back.querySelector("button")).toBeNull();
    expect(back.closest("button")).toBeNull();
  });
});
