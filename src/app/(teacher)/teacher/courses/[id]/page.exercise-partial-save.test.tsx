/**
 * Review web#98 B1: lưu bộ test gồm nhiều request tuần tự. Request thứ N lỗi thì N-1 request trước ĐÃ lưu;
 * trước đây form bị nạp lại ngầm (bản nháp biến mất, không lời nào) và lần lưu sau báo thành công giả.
 * Giờ: nút lưu khoá tới khi nạp lại xong, form dựng lại theo dữ liệu đã lưu, giảng viên được báo rõ;
 * bấm lưu hai lần liên tiếp không gửi trùng.
 *
 * Dùng editor THẬT + react-query thật; API giả ở tầng `@/lib/api-client`.
 */

import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "course-1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
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
vi.mock("@/hooks/queries/use-lesson-content", () => ({
  useLessonContents: () => ({
    data: [{ id: "ct-code", lesson_id: "les-1", type: "exercise", title: "Nhân đôi", exercise_id: "ex-7", display_order: 1 }],
    isLoading: false,
  }),
  useCreateLessonContent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteLessonContent: () => ({ mutate: vi.fn() }),
  lessonContentKeys: { contents: (id: string) => ["lesson-content", id] },
}));
vi.mock("@/hooks/queries/use-live-sessions", () => ({ useCreateLiveSession: () => ({ mutateAsync: vi.fn(), isPending: false }) }));
vi.mock("@/hooks/queries/use-classes", () => ({
  useClasses: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}));
vi.mock("@/components/teacher/add-content-modal", () => ({ AddContentModal: () => null }));
vi.mock("@/components/teacher/quiz-duplicate-button", () => ({ QuizDuplicateButton: () => null }));
const updateContent = vi.fn().mockResolvedValue({});
vi.mock("@/services/lesson-content.service", () => ({
  lessonContentService: { updateContent: (...a: unknown[]) => updateContent(...a), createContent: vi.fn(), deleteContent: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCourseDetailPage from "./page";
// eslint-disable-next-line import/first
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
// eslint-disable-next-line import/first
import { renderWithProviders } from "@/test/utils";

const EXERCISE = { id: "ex-7", title: "Nhân đôi", time_limit: 2, memory_limit: 256, pass_percentage: 100 };
type ServerTest = { id: string; exercise_id: string; input: string; expected_output: string; is_hidden: boolean; display_order: number };
let serverTests: ServerTest[] = [];
/** Khác null thì GET testcases chờ tới khi gọi hàm này (kiểm nút lưu khoá trong lúc nạp lại). */
let holdTestCases: Promise<void> | null = null;

function testCasesGets() {
  return mockApi.get.mock.calls.filter(([url]) => url === "/exercises/ex-7/testcases").length;
}

async function openEditor() {
  renderWithProviders(<TeacherCourseDetailPage />);
  fireEvent.click(screen.getByText("Bài 1"));
  fireEvent.click(screen.getByTitle("Chỉnh sửa"));
  await screen.findByDisplayValue("1 2");
}

async function addTest(n: number, input: string, output: string) {
  fireEvent.click(screen.getByRole("button", { name: /thêm test case/i }));
  fireEvent.change(screen.getByLabelText(`Đầu vào test ${n}`), { target: { value: input } });
  fireEvent.change(screen.getByLabelText(`Đầu ra mong đợi test ${n}`), { target: { value: output } });
}

const saveButton = () => screen.getByRole("button", { name: "Lưu thay đổi" }) as HTMLButtonElement;

beforeEach(() => {
  resetMockApi();
  updateContent.mockClear();
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
  holdTestCases = null;
  serverTests = [{ id: "t1", exercise_id: "ex-7", input: "1 2", expected_output: "3", is_hidden: false, display_order: 1 }];
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/exercises/ex-7/testcases") {
      if (holdTestCases) await holdTestCases;
      return envelope(serverTests.map((t) => ({ ...t })));
    }
    return envelope(EXERCISE);
  });
});

describe("/teacher/courses/[id] — lưu bộ test lỗi giữa chừng (review B1)", () => {
  it("POST A thành công, POST B lỗi -> khoá nút tới khi nạp lại, form theo dữ liệu đã lưu, báo rõ cho giảng viên", async () => {
    let posts = 0;
    mockApi.post.mockImplementation(async (_url: string, body: { input: string; expected_output: string; display_order: number }) => {
      posts += 1;
      if (posts === 2) throw new Error("Máy chủ từ chối test thứ hai");
      const saved = { id: `t-new-${posts}`, exercise_id: "ex-7", is_hidden: false, ...body };
      serverTests.push(saved);
      return envelope(saved);
    });
    await openEditor();
    await addTest(2, "a", "A");
    await addTest(3, "b", "B");
    const getsBefore = testCasesGets();

    let releaseReload: () => void = () => undefined;
    holdTestCases = new Promise((resolve) => {
      releaseReload = resolve;
    });
    fireEvent.click(saveButton());

    // Đang nạp lại sau lỗi: nút lưu vẫn khoá, chưa báo gì sai lệch.
    await waitFor(() => expect(testCasesGets()).toBe(getsBefore + 1));
    expect(saveButton().disabled).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();

    holdTestCases = null;
    await act(async () => releaseReload());

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    const message = vi.mocked(toast.error).mock.calls[0][0] as string;
    expect(message).toContain("Lưu bộ test chưa xong");
    expect(message).toContain("Máy chủ từ chối test thứ hai");
    expect(message).toContain("nạp lại theo dữ liệu đã lưu");
    expect(updateContent).not.toHaveBeenCalled();

    // Form khớp backend: test A đã lưu còn đó, test B (chưa lưu) không còn trong form.
    expect(await screen.findByDisplayValue("a")).toBeTruthy();
    expect(screen.queryByLabelText("Đầu vào test 3")).toBeNull();
    expect(saveButton().disabled).toBe(false);

    // Lưu lại ngay: form đã khớp backend nên không gửi lại A, chỉ đổi tiêu đề.
    fireEvent.click(saveButton());
    await waitFor(() => expect(updateContent).toHaveBeenCalledTimes(1));
    expect(mockApi.post).toHaveBeenCalledTimes(2);
  });

  it("bấm lưu hai lần liên tiếp trong lúc đang lưu -> chỉ một POST", async () => {
    let finishPost: () => void = () => undefined;
    mockApi.post.mockImplementation(
      (_url: string, body: Record<string, unknown>) =>
        new Promise((resolve) => {
          finishPost = () => resolve(envelope({ id: "t-new", exercise_id: "ex-7", ...body }));
        }),
    );
    await openEditor();
    await addTest(2, "a", "A");

    // Hai cú bấm trong CÙNG một lượt (trước khi React kịp render `disabled`) — như double-click nhanh.
    const button = saveButton();
    await act(async () => {
      button.click();
      button.click();
    });
    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    fireEvent.click(saveButton());

    await act(async () => finishPost());
    await waitFor(() => expect(updateContent).toHaveBeenCalledTimes(1));
    expect(mockApi.post).toHaveBeenCalledTimes(1);
  });
});
