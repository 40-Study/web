/**
 * Wave-2 W2-7 (Q2-08): mở /teacher/courses/<id không phải UUID> bắn thêm một request sections cũng trả 400
 * (backend `uuid.Parse`). Request khoá học vẫn chạy để trang hiện "Không tìm thấy"; request sections phải bị chặn.
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── next/navigation — override mock global (vitest.setup.ts) để có :id thật ─────────────────
let mockCourseId = "course-1";
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: mockCourseId }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

// ─── @tanstack/react-query — chỉ cần useQueryClient (page gọi invalidateQueries) ─────────────
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

// ─── auth store — controllable qua biến module-level ─────────────────────────────────────────
const mockAuthState: { userId?: string; activeRole?: string } = {};
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { user?: { id: string }; activeRole?: string }) => unknown) =>
    selector({
      user: mockAuthState.userId ? { id: mockAuthState.userId } : undefined,
      activeRole: mockAuthState.activeRole,
    }),
}));

// ─── course/section/lesson query hooks — course controllable, phần còn lại stub rỗng ─────────
const COURSE_OWNER_ID = "teacher-owner-uuid";
let mockCourse: Record<string, unknown> | undefined;
let mockCourseError: unknown;
const mockRefetchCourse = vi.fn();

vi.mock("@/hooks/queries/use-courses", () => ({
  useCourse: () => ({
    data: mockCourse,
    isLoading: false,
    isError: mockCourseError !== undefined,
    error: mockCourseError,
    refetch: mockRefetchCourse,
  }),
  useUpdateCourse: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Phase 3: nút "Gửi duyệt" (CourseReviewPanel) dùng useMutation — react-query bị mock ở trên.
vi.mock("@/hooks/queries/use-course-approval", () => ({
  useSubmitCourseReview: () => ({ mutate: vi.fn(), isPending: false }),
  useWithdrawCourseReview: () => ({ mutate: vi.fn(), isPending: false }),
}));

const mockUseSections = vi.fn((_courseId: string) => ({ data: [], isLoading: false }));
vi.mock("@/hooks/queries/use-sections", () => ({
  useSections: (courseId: string) => mockUseSections(courseId),
  sectionKeys: { byCourse: (id: string) => ["sections", id] },
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

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCourseDetailPage from "./page";
import { ApiError } from "@/lib/errors";

const VALID_ID = "3f2b8c1e-9a44-4d7e-8b1a-0c5d6e7f8a90";

beforeEach(() => {
  mockUseSections.mockClear();
  mockCourse = undefined;
  mockCourseError = new ApiError(404, "NOT_FOUND", "not found");
});

describe("/teacher/courses/[id] — id không hợp lệ", () => {
  it.each(["abc", "course-1", "123", "00000000-0000-0000-0000"])(
    "id %j: không gọi sections (truyền id rỗng cho hook), vẫn hiện 'Không tìm thấy'",
    (id) => {
      mockCourseId = id;
      render(<TeacherCourseDetailPage />);
      expect(mockUseSections).toHaveBeenCalled();
      for (const [arg] of mockUseSections.mock.calls) expect(arg).toBe("");
      expect(screen.getByText(/không tìm thấy/i)).toBeTruthy();
    }
  );

  it("id UUID hợp lệ: vẫn tải sections như cũ", () => {
    mockCourseId = VALID_ID;
    render(<TeacherCourseDetailPage />);
    expect(mockUseSections).toHaveBeenCalledWith(VALID_ID);
  });
});
