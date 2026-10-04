/**
 * Review đối kháng web PR #27 (MAJOR): trang quản lý khóa `/teacher/courses/[id]` không có
 * test tự động nào cho phần kiểm quyền chủ khóa (`isOwner`) — nếu sau này ai đó refactor
 * (VD gộp trang xem-trước công khai với trang quản lý) mà vô tình xoá đoạn check, suite
 * `vitest run` vẫn xanh 100%, không có gì bắt lại lỗi lộ quyền (teacher2 xem được trang quản
 * lý khóa của teacher1 — P1 QA 260927 teacher).
 *
 * 3 kịch bản: chủ khóa thật sự → thấy trang quản lý; giáo viên KHÁC → "Không có quyền truy
 * cập"; SYSTEM_ADMIN → vào được dù không phải chủ khóa (nhất quán với isAdmin-bypass sẵn có ở
 * mọi endpoint quản lý khóa phía backend, xem `course_handler.go` isAdminActor).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// ─── next/navigation — override mock global (vitest.setup.ts) để có :id thật ─────────────────
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "course-1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

// ─── @tanstack/react-query — chỉ cần useQueryClient (page gọi invalidateQueries) ─────────────
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

// ─── auth store — controllable qua biến module-level ─────────────────────────────────────────
let mockAuthState: { userId?: string; activeRole?: string } = {};
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

vi.mock("@/hooks/queries/use-sections", () => ({
  useSections: () => ({ data: [], isLoading: false }),
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

// Import SAU khi mock — page.tsx đọc các hook ở module scope qua import tĩnh, Vitest hoists
// vi.mock() lên đầu file nên thứ tự import bên dưới vẫn đúng thời điểm.
// eslint-disable-next-line import/first
import TeacherCourseDetailPage from "./page";
import { ApiError } from "@/lib/errors";

function setScenario(opts: { userId?: string; activeRole?: string; instructorId: string }) {
  mockAuthState = { userId: opts.userId, activeRole: opts.activeRole };
  mockCourseError = undefined;
  mockRefetchCourse.mockReset();
  mockCourse = {
    id: "course-1",
    title: "Khóa test",
    short_description: "Mô tả ngắn",
    thumbnail_url: undefined,
    status: "published",
    instructor_id: opts.instructorId,
  };
}

describe("/teacher/courses/[id] — kiểm quyền chủ khóa (review đối kháng PR #27)", () => {
  it("giáo viên KHÔNG phải chủ khóa: thấy 'Không có quyền truy cập', không thấy giao diện quản lý", () => {
    setScenario({ userId: "teacher-2-uuid", instructorId: COURSE_OWNER_ID });
    render(<TeacherCourseDetailPage />);
    expect(screen.getByText("Không có quyền truy cập")).toBeTruthy();
  });

  it("chủ khóa thật sự: KHÔNG thấy màn 'Không có quyền truy cập'", () => {
    setScenario({ userId: COURSE_OWNER_ID, instructorId: COURSE_OWNER_ID });
    render(<TeacherCourseDetailPage />);
    expect(screen.queryByText("Không có quyền truy cập")).toBeNull();
  });

  it("SYSTEM_ADMIN không phải chủ khóa: vẫn vào được (không thấy 'Không có quyền truy cập')", () => {
    setScenario({ userId: "some-admin-uuid", activeRole: "SYSTEM_ADMIN", instructorId: COURSE_OWNER_ID });
    render(<TeacherCourseDetailPage />);
    expect(screen.queryByText("Không có quyền truy cập")).toBeNull();
  });

  it("refetch lỗi 5xx khi đã có khoá: giữ trang quản lý, chỉ hiện thông báo nhỏ + Thử lại", () => {
    setScenario({ userId: COURSE_OWNER_ID, instructorId: COURSE_OWNER_ID });
    mockCourseError = new ApiError(500, "INTERNAL", "boom");
    render(<TeacherCourseDetailPage />);

    expect(screen.queryByRole("heading", { name: "Không tải được khoá học" })).toBeNull();
    expect(screen.getByText("Khóa test")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mockRefetchCourse).toHaveBeenCalledTimes(1);
  });
});
