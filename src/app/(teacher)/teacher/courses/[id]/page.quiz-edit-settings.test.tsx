/**
 * QA2 Q2-04 (smoke2 PARTIAL): bút chì trên hàng quiz đã tạo phải cho xem/sửa điểm đạt (%) và số lần làm tối đa,
 * lưu qua PUT /quizzes/:id (chỉ phần đã đổi). Hành vi của editor ở quiz-settings-editor.test.tsx.
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
vi.mock("@/components/teacher/quiz-duplicate-button", () => ({ QuizDuplicateButton: () => null }));

// Editor tự nạp quiz bằng react-query (đã có test riêng); ở đây chỉ kiểm hộp thoại sửa gắn nó và lưu đúng.
let mockEditorState: { payload: Record<string, number> | null; blocked: boolean; unsavedQuestions?: number } = { payload: null, blocked: false };
vi.mock("@/components/teacher/quiz-settings-editor", async () => {
  const React = await import("react");
  return {
    QuizSettingsEditor: ({ quizId, onChange }: { quizId: string; onChange: (s: unknown) => void }) => {
      React.useEffect(() => onChange(mockEditorState), [onChange]);
      return <div data-testid="quiz-settings-editor" data-quiz={quizId} />;
    },
  };
});
const updateContent = vi.fn().mockResolvedValue({});
vi.mock("@/services/lesson-content.service", () => ({ lessonContentService: { updateContent: (...a: unknown[]) => updateContent(...a) } }));
const updateQuiz = vi.fn().mockResolvedValue({});
vi.mock("@/services/quiz.service", () => ({ quizService: { update: (...a: unknown[]) => updateQuiz(...a) } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCourseDetailPage from "./page";

/** Hàng 0 = quiz "Kiểm tra Git", hàng 1 = bài viết "Bài đọc" (thứ tự CONTENTS). */
function openEditFor(rowTitle: "Kiểm tra Git" | "Bài đọc") {
  mockCourse = { id: "course-1", title: "Khoá test", instructor_id: OWNER_ID, status: "draft" };
  render(<TeacherCourseDetailPage />);
  fireEvent.click(screen.getByText("Bài 1"));
  fireEvent.click(screen.getAllByTitle("Chỉnh sửa")[rowTitle === "Kiểm tra Git" ? 0 : 1]);
}

describe("/teacher/courses/[id] — sửa điểm đạt / số lần làm của quiz đã tạo (Q2-04)", () => {
  beforeEach(() => {
    updateContent.mockClear();
    updateQuiz.mockClear();
    mockEditorState = { payload: null, blocked: false };
  });

  it("hộp thoại sửa hàng quiz có editor cài đặt gắn đúng quiz_id; hàng bài viết thì không", () => {
    openEditFor("Kiểm tra Git");
    expect(screen.getByTestId("quiz-settings-editor").getAttribute("data-quiz")).toBe("quiz-9");
  });

  it("hàng bài viết: không có editor cài đặt quiz", () => {
    openEditFor("Bài đọc");
    expect(screen.queryByTestId("quiz-settings-editor")).toBeNull();
  });

  it("lưu: cập nhật tiêu đề rồi PUT /quizzes/:id với phần đã đổi", async () => {
    mockEditorState = { payload: { pass_percentage: 80, max_attempts: 5 }, blocked: false };
    openEditFor("Kiểm tra Git");
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => expect(updateQuiz).toHaveBeenCalledWith("quiz-9", { pass_percentage: 80, max_attempts: 5 }));
    expect(updateContent).toHaveBeenCalledWith("les-1", "ct-quiz", { title: "Kiểm tra Git" });
  });

  it("không đổi cài đặt: không gọi PUT /quizzes/:id", async () => {
    openEditFor("Kiểm tra Git");
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => expect(updateContent).toHaveBeenCalled());
    expect(updateQuiz).not.toHaveBeenCalled();
  });

  it("cài đặt không hợp lệ: nút lưu bị khoá, không gọi API", () => {
    mockEditorState = { payload: null, blocked: true };
    openEditFor("Kiểm tra Git");
    const save = screen.getByRole("button", { name: "Lưu thay đổi" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.click(save);
    expect(updateContent).not.toHaveBeenCalled();
    expect(updateQuiz).not.toHaveBeenCalled();
  });
});

// Q5-T03: nút lưu đã khoá khi còn câu chưa lưu (Q4-T03) nhưng Huỷ / Esc / bấm nền đóng thẳng và mất chỉnh sửa.
describe("/teacher/courses/[id] — đóng hộp thoại sửa quiz khi còn câu hỏi chưa lưu (Q5-T03)", () => {
  beforeEach(() => {
    mockEditorState = { payload: null, blocked: true, unsavedQuestions: 2 };
  });

  const editDialogOpen = () => screen.queryByText("Chỉnh sửa nội dung") !== null;

  it("bấm Huỷ: hỏi 'Bỏ chỉnh sửa chưa lưu?' và hộp thoại sửa vẫn mở", async () => {
    openEditFor("Kiểm tra Git");
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));

    expect(await screen.findByText("Bỏ chỉnh sửa chưa lưu?")).toBeTruthy();
    expect(screen.getByText(/Đóng bây giờ sẽ mất các chỉnh sửa đó/)).toBeTruthy();
    expect(editDialogOpen()).toBe(true);
  });

  it("Esc cũng bị chặn bằng hộp xác nhận (cùng đường onOpenChange với bấm nền)", async () => {
    openEditFor("Kiểm tra Git");
    fireEvent.keyDown(screen.getByText("Chỉnh sửa nội dung"), { key: "Escape" });

    expect(await screen.findByText("Bỏ chỉnh sửa chưa lưu?")).toBeTruthy();
    expect(editDialogOpen()).toBe(true);
  });

  it("'Tiếp tục chỉnh sửa': giữ nguyên hộp thoại sửa, đóng hộp xác nhận", async () => {
    openEditFor("Kiểm tra Git");
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));
    fireEvent.click(await screen.findByRole("button", { name: "Tiếp tục chỉnh sửa" }));

    await waitFor(() => expect(screen.queryByText("Bỏ chỉnh sửa chưa lưu?")).toBeNull());
    expect(editDialogOpen()).toBe(true);
  });

  it("'Bỏ chỉnh sửa': đóng cả hộp thoại sửa", async () => {
    openEditFor("Kiểm tra Git");
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));
    fireEvent.click(await screen.findByRole("button", { name: "Bỏ chỉnh sửa" }));

    await waitFor(() => expect(editDialogOpen()).toBe(false));
  });

  it("không còn câu chưa lưu: Huỷ đóng thẳng, không hỏi", async () => {
    mockEditorState = { payload: null, blocked: false, unsavedQuestions: 0 };
    openEditFor("Kiểm tra Git");
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));

    await waitFor(() => expect(editDialogOpen()).toBe(false));
    expect(screen.queryByText("Bỏ chỉnh sửa chưa lưu?")).toBeNull();
  });
});

// Q5-T09: nút mũi tên mở/đóng bài học chỉ có icon, không có tên cho trình đọc màn hình.
describe("/teacher/courses/[id] — nút mở rộng bài học có tên (Q5-T09)", () => {
  it("tên đổi theo trạng thái và aria-expanded khớp", () => {
    mockCourse = { id: "course-1", title: "Khoá test", instructor_id: OWNER_ID, status: "draft" };
    render(<TeacherCourseDetailPage />);

    const toggle = screen.getByRole("button", { name: "Mở rộng bài học" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);

    const opened = screen.getByRole("button", { name: "Thu gọn bài học" });
    expect(opened.getAttribute("aria-expanded")).toBe("true");
  });
});

