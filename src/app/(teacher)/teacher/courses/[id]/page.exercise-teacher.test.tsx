/**
 * QA ce-main-261021 F7 (#1, #2) — trang quản lý khoá:
 *  - hàng bài code mở danh sách bài nộp của học viên (trước: mở tab `/exercises/:id` không tồn tại, 404);
 *  - bút chì trên bài code có editor bộ test + giới hạn chấm và lưu nó trước tiêu đề (trước: chỉ tiêu đề);
 *  - tạo bài code gửi kèm giới hạn chấm giảng viên nhập.
 * Hành vi chi tiết của panel/editor nằm trong test riêng ở `components/teacher/exercise-*.test.tsx`.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
vi.mock("@/hooks/queries/use-courses", () => ({
  useCourse: () => ({ data: { id: "course-1", title: "Khoá test", instructor_id: OWNER_ID, status: "draft" }, isLoading: false }),
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
const CONTENTS = [{ id: "ct-code", lesson_id: "les-1", type: "exercise", title: "Nhân đôi", exercise_id: "ex-7", display_order: 1 }];
vi.mock("@/hooks/queries/use-lesson-content", () => ({
  useLessonContents: () => ({ data: CONTENTS, isLoading: false }),
  useCreateLessonContent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteLessonContent: () => ({ mutate: vi.fn() }),
  lessonContentKeys: { contents: (id: string) => ["lesson-content", id] },
}));
vi.mock("@/hooks/queries/use-live-sessions", () => ({ useCreateLiveSession: () => ({ mutateAsync: vi.fn(), isPending: false }) }));
vi.mock("@/hooks/queries/use-classes", () => ({
  useClasses: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));
vi.mock("@/components/teacher/quiz-duplicate-button", () => ({ QuizDuplicateButton: () => null }));

const CODE_PAYLOAD = {
  type: "exercise",
  exerciseType: "code",
  title: "Bài mới",
  description: "In 2n",
  language: "python",
  starterCode: "",
  testCases: [{ id: "a", input: "3", output: "6", hidden: false }],
  codeLimits: { time_limit: 5, memory_limit: 128, pass_percentage: 70 },
};
vi.mock("@/components/teacher/add-content-modal", () => ({
  AddContentModal: ({ open, onSubmit }: { open: boolean; onSubmit: (d: unknown) => unknown }) =>
    open ? <button type="button" onClick={() => void onSubmit(CODE_PAYLOAD)}>gui-code</button> : null,
}));
vi.mock("@/components/teacher/exercise-submissions-panel", () => ({
  ExerciseSubmissionsPanel: ({ exerciseId, exerciseTitle }: { exerciseId: string; exerciseTitle: string }) => (
    <div data-testid="submissions-panel" data-exercise={exerciseId}>{exerciseTitle}</div>
  ),
}));
const PLAN = { exerciseUpdate: { time_limit: 4 }, updates: [], creates: [], deletes: [] };
let mockEditorState: { plan: unknown; blocked: boolean } = { plan: null, blocked: false };
vi.mock("@/components/teacher/exercise-settings-editor", async () => {
  const React = await import("react");
  return {
    exerciseEditKeys: { detail: (id: string) => ["teacher-exercise", id] },
    ExerciseSettingsEditor: ({ exerciseId, onChange }: { exerciseId: string; onChange: (s: unknown) => void }) => {
      React.useEffect(() => onChange(mockEditorState), [onChange]);
      return <div data-testid="exercise-settings-editor" data-exercise={exerciseId} />;
    },
  };
});
const applyPlan = vi.fn().mockResolvedValue(undefined);
vi.mock("@/components/teacher/exercise-edit-plan", () => ({ applyExerciseEditPlan: (...a: unknown[]) => applyPlan(...a) }));
const updateContent = vi.fn().mockResolvedValue({});
const createContent = vi.fn().mockResolvedValue({ id: "ct-new" });
vi.mock("@/services/lesson-content.service", () => ({
  lessonContentService: {
    updateContent: (...a: unknown[]) => updateContent(...a),
    createContent: (...a: unknown[]) => createContent(...a),
    deleteContent: vi.fn(),
  },
}));
const createExercise = vi.fn().mockResolvedValue({ id: "ex-new" });
const importTestCases = vi.fn().mockResolvedValue([]);
vi.mock("@/services/exercise.service", () => ({
  exerciseService: {
    create: (...a: unknown[]) => createExercise(...a),
    importTestCases: (...a: unknown[]) => importTestCases(...a),
    delete: vi.fn(),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCourseDetailPage from "./page";

function openLesson() {
  render(<TeacherCourseDetailPage />);
  fireEvent.click(screen.getByText("Bài 1"));
}

beforeEach(() => {
  applyPlan.mockClear();
  updateContent.mockClear();
  createExercise.mockClear();
  mockEditorState = { plan: null, blocked: false };
});

describe("/teacher/courses/[id] — bài thực hành code (giảng viên)", () => {
  it("bấm hàng bài code -> mở danh sách bài nộp của đúng exercise_id, không mở tab mới", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    openLesson();
    expect(screen.queryByTestId("submissions-panel")).toBeNull();

    fireEvent.click(screen.getByText("Nhân đôi"));

    expect(screen.getByTestId("submissions-panel").getAttribute("data-exercise")).toBe("ex-7");
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it("nút 'Bài nộp của học viên' trên hàng cũng mở danh sách", () => {
    openLesson();
    fireEvent.click(screen.getByRole("button", { name: "Bài nộp của học viên: Nhân đôi" }));
    expect(screen.getByTestId("submissions-panel")).toBeTruthy();
  });

  it("bút chì -> editor bộ test gắn exercise_id; lưu áp dụng kế hoạch rồi mới đổi tiêu đề", async () => {
    mockEditorState = { plan: PLAN, blocked: false };
    openLesson();
    fireEvent.click(screen.getByTitle("Chỉnh sửa"));
    expect(screen.getByTestId("exercise-settings-editor").getAttribute("data-exercise")).toBe("ex-7");

    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => expect(applyPlan).toHaveBeenCalledWith("ex-7", PLAN));
    await waitFor(() => expect(updateContent).toHaveBeenCalledWith("les-1", "ct-code", { title: "Nhân đôi" }));
    expect(applyPlan.mock.invocationCallOrder[0]).toBeLessThan(updateContent.mock.invocationCallOrder[0]);
  });

  it("lưu bộ test lỗi -> không đổi tiêu đề", async () => {
    mockEditorState = { plan: PLAN, blocked: false };
    applyPlan.mockRejectedValueOnce(new Error("404"));
    openLesson();
    fireEvent.click(screen.getByTitle("Chỉnh sửa"));
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => expect(applyPlan).toHaveBeenCalled());
    expect(updateContent).not.toHaveBeenCalled();
  });

  it("editor báo chặn -> nút lưu bị khoá", () => {
    mockEditorState = { plan: null, blocked: true };
    openLesson();
    fireEvent.click(screen.getByTitle("Chỉnh sửa"));
    expect((screen.getByRole("button", { name: "Lưu thay đổi" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("tạo bài code gửi kèm giới hạn chấm giảng viên nhập", async () => {
    openLesson();
    fireEvent.click(screen.getByRole("button", { name: /Thêm nội dung/ }));
    fireEvent.click(screen.getByRole("button", { name: "gui-code" }));

    await waitFor(() => expect(createExercise).toHaveBeenCalledTimes(1));
    expect(createExercise.mock.calls[0][0]).toMatchObject({ time_limit: 5, memory_limit: 128, pass_percentage: 70 });
  });
});
