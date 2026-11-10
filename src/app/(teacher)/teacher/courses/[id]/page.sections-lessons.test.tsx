/**
 * QA-B-11 (261110): trang chi tiết khoá của giảng viên gọi GET /sections/:id/lessons cho TỪNG chương (N+1) nên chỉ có
 * spinner hơn 30 giây. GET /courses/:id/sections đã trả sẵn `lessons[]`; trang phải dùng nó, không gọi theo chương.
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "11111111-1111-4111-8111-111111111111" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn(), getQueryData: vi.fn(), refetchQueries: vi.fn() }),
}));
const OWNER_ID = "teacher-owner-uuid";
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { user?: { id: string }; activeRole?: string }) => unknown) =>
    selector({ user: { id: OWNER_ID }, activeRole: "TEACHER" }),
}));
vi.mock("@/hooks/queries/use-courses", () => ({
  useCourse: () => ({ data: { id: "c1", title: "Khoá test", instructor_id: OWNER_ID, status: "draft" }, isLoading: false }),
  useUpdateCourse: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/queries/use-course-approval", () => ({
  useSubmitCourseReview: () => ({ mutate: vi.fn(), isPending: false }),
  useWithdrawCourseReview: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/queries/use-sections", () => ({
  useSections: () => ({
    data: [
      { id: "sec-1", title: "Chương 1", display_order: 0, lessons: [{ id: "l1", title: "Bài 1.1" }, { id: "l2", title: "Bài 1.2" }] },
      { id: "sec-2", title: "Chương 2", display_order: 1, lessons: [{ id: "l3", title: "Bài 2.1" }] },
      { id: "sec-3", title: "Chương 3", display_order: 2, lessons: [] },
    ],
    isLoading: false,
  }),
  sectionKeys: { byCourse: (id: string) => ["sections", id] },
  useCreateSection: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderSections: () => ({ mutate: vi.fn() }),
  useDeleteSection: () => ({ mutate: vi.fn() }),
}));
// Hook tải bài theo từng chương: nếu trang còn gọi nó thì test này phải đỏ.
const useLessonsSpy = vi.fn((..._args: unknown[]) => ({ data: [], isLoading: true }));
vi.mock("@/hooks/queries/use-lessons", () => ({
  useLessons: (...args: unknown[]) => useLessonsSpy(...args),
  lessonKeys: { bySection: (c: string, s: string) => ["lessons", "section", c, s] },
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
vi.mock("@/hooks/queries/use-live-sessions", () => ({ useCreateLiveSession: () => ({ mutateAsync: vi.fn(), isPending: false }) }));
vi.mock("@/hooks/queries/use-classes", () => ({
  useClasses: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));
vi.mock("@/components/teacher/add-content-modal", () => ({ AddContentModal: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCourseDetailPage from "./page";

describe("/teacher/courses/[id] — bài học lấy từ danh sách chương (QA-B-11)", () => {
  beforeEach(() => useLessonsSpy.mockClear());

  it("hiện bài học của mọi chương từ GET /courses/:id/sections, không gọi lessons theo từng chương", () => {
    render(<TeacherCourseDetailPage />);

    expect(screen.getByText("Bài 1.1")).toBeTruthy();
    expect(screen.getByText("Bài 1.2")).toBeTruthy();
    expect(screen.getByText("Bài 2.1")).toBeTruthy();
    expect(screen.getByText("2 bài")).toBeTruthy();
    expect(screen.getByText("1 bài")).toBeTruthy();
    expect(screen.queryByText("Đang tải...")).toBeNull();
    expect(useLessonsSpy).not.toHaveBeenCalled();
  });
});
