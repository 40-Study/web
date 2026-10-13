/**
 * QA2 Q2-03: hàng nội dung `quiz` của bài học có nút nhân bản (chỉ khi sửa được, tức không chờ duyệt) và
 * nút nhận đúng `quiz_id` của hàng. Hành vi nhân bản nằm ở quiz-duplicate-button.test.tsx; ở đây chỉ kiểm
 * đã nối vào trang và tôn trọng readOnly (Q5).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
const CONTENTS = [
  { id: "ct-quiz", lesson_id: "les-1", type: "quiz", title: "Kiểm tra Git", quiz_id: "quiz-9", is_mandatory: false, display_order: 1 },
  { id: "ct-art", lesson_id: "les-1", type: "article", title: "Bài đọc", display_order: 2 },
];
vi.mock("@/hooks/queries/use-lesson-content", () => ({
  useLessonContents: () => ({ data: CONTENTS, isLoading: false }),
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
vi.mock("@/components/teacher/add-content-modal", () => ({ AddContentModal: () => null }));
vi.mock("@/components/teacher/quiz-duplicate-button", () => ({
  QuizDuplicateButton: ({ lessonId, quizId, isMandatory }: { lessonId: string; quizId: string; isMandatory?: boolean }) => (
    <button type="button" title="Nhân bản bài trắc nghiệm" data-lesson={lessonId} data-quiz={quizId} data-mandatory={String(isMandatory)} />
  ),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCourseDetailPage from "./page";

function openLesson(status: string) {
  mockCourse = { id: "course-1", title: "Khóa test", instructor_id: OWNER_ID, status };
  render(<TeacherCourseDetailPage />);
  fireEvent.click(screen.getByText("Bài 1"));
}

describe("/teacher/courses/[id] — nhân bản bài trắc nghiệm (Q2-03)", () => {
  it("khoá nháp: đúng một nút nhân bản, trên hàng quiz, mang lessonId và quiz_id của hàng đó", () => {
    openLesson("draft");
    const buttons = screen.getAllByTitle("Nhân bản bài trắc nghiệm");
    expect(buttons).toHaveLength(1); // bài viết không có nút
    expect(buttons[0].getAttribute("data-quiz")).toBe("quiz-9");
    expect(buttons[0].getAttribute("data-lesson")).toBe("les-1");
    expect(buttons[0].getAttribute("data-mandatory")).toBe("false"); // truyền is_mandatory của hàng gốc
  });

  it("khoá chờ duyệt (chỉ đọc): không có nút nhân bản", () => {
    openLesson("pending_review");
    expect(screen.getByText("Kiểm tra Git")).toBeTruthy();
    expect(screen.queryAllByTitle("Nhân bản bài trắc nghiệm")).toHaveLength(0);
  });
});
