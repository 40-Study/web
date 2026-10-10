/**
 * QA follow-up 261008 phase 2 — trang học hiển thị nội dung ARTICLE và QUIZ.
 *
 * Trước đây: trang coi mọi bài không phải bài tập/live là video; nhánh quiz bị chặn bởi `lesson.type`
 * (curriculum không trả field này) nên không bao giờ chạy. Giờ loại bài lấy từ `lesson_contents`.
 * Quiz có hai đường tới màn hình (content `quiz` và `GET /lessons/:id/quizzes`), tab Quiz không được
 * liệt kê lại quiz đã hiện làm nội dung (plan D2).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ courseSlug: "git-co-ban", lessonId: "les-1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

vi.mock("@/hooks/queries/use-courses", () => ({
  courseKeys: { enrolled: () => ["courses", "enrolled"] },
  useCourseBySlug: () => ({
    data: { id: "course-1", title: "Git cơ bản", slug: "git-co-ban", total_students: 3 },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/hooks/queries/use-enrollments", () => ({
  useMyEnrollments: () => ({ data: [] }),
  enrollmentKeys: { all: ["enrollments"] },
}));
vi.mock("@/hooks/queries/use-sections", () => ({
  sectionKeys: { byCourse: (id: string) => ["sections", "course", id] },
  useSections: () => ({
    data: [
      {
        id: "sec-1",
        course_id: "course-1",
        title: "Chương 1",
        display_order: 0,
        lessons: [
          { id: "les-1", section_id: "sec-1", title: "Bài 1", display_order: 0, locked: false },
          { id: "les-2", section_id: "sec-1", title: "Bài 2", display_order: 1, locked: false },
        ],
      },
    ],
    isLoading: false,
  }),
}));

interface MockContent {
  id: string;
  type: string;
  title: string;
  display_order: number;
  article_body?: string;
  reading_time_minutes?: number;
  quiz_id?: string;
}
let mockContents: MockContent[] = [];
vi.mock("@/hooks/queries/use-lesson-content", () => ({
  useLessonContents: () => ({ data: mockContents, refetch: vi.fn() }),
}));
vi.mock("@/hooks/use-hls", () => ({ useHlsInfo: () => ({ data: undefined, isLoading: false, error: null }) }));

const mockUseQuiz = vi.fn();
const mockStartQuiz = vi.fn();
const mockSubmitQuiz = vi.fn();
let mockLessonQuizzes: { id: string; title: string }[] = [];
vi.mock("@/hooks/queries/use-quiz", () => ({
  useQuiz: (id?: string) => mockUseQuiz(id),
  useQuizzesByLesson: () => ({ data: mockLessonQuizzes }),
  useStartQuiz: () => ({ mutateAsync: mockStartQuiz, isPending: false }),
  useSubmitQuiz: () => ({ mutateAsync: mockSubmitQuiz, isPending: false }),
  useSaveQuizAnswer: () => ({ mutate: vi.fn() }),
  useQuizAttemptDetail: () => ({ data: undefined, isLoading: false, isError: false }),
}));
vi.mock("@/components/quiz", () => ({ QuizAttemptReview: () => null }));
vi.mock("@/services/enrollment.service", () => ({ enrollmentService: { updateProgress: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Barrel của player: giữ stub mỏng; PlayerTabs liệt kê tiêu đề quiz để kiểm tra việc khử trùng.
vi.mock("@/components/player", () => ({
  PlayerHeader: () => null,
  PlayerLessonSidebar: ({ chapters }: { chapters: { lessons: { id: string; type: string }[] }[] }) => (
    <ul data-testid="sidebar">
      {chapters.flatMap((c) => c.lessons).map((l) => (
        <li key={l.id}>{`${l.id}:${l.type}`}</li>
      ))}
    </ul>
  ),
  PlayerTabs: ({ lessonQuizzes = [] }: { lessonQuizzes?: { id: string; title: string }[] }) => (
    <ul data-testid="tab-quizzes">
      {lessonQuizzes.map((q) => (
        <li key={q.id}>{q.title}</li>
      ))}
    </ul>
  ),
  FloatingButtons: () => null,
  CodeEditorModal: () => null,
  QuizLessonContent: ({ onSubmit }: { onSubmit: (answers: unknown[]) => void }) => (
    <button onClick={() => onSubmit([{ question_id: "qq", selected_answer_ids: ["aa"] }])}>nộp-quiz</button>
  ),
  HeartbeatVideo: () => null,
  LessonLockedNotice: () => null,
  LessonStudyTools: () => null,
  KeyboardShortcutsDialog: () => null,
  LessonLoadError: () => null,
}));

// eslint-disable-next-line import/first
import CourseLessonPage from "./page";

function renderPage(client = new QueryClient()) {
  return render(
    <QueryClientProvider client={client}>
      <CourseLessonPage />
    </QueryClientProvider>
  );
}

describe("/learn/[courseSlug]/[lessonId] — bài viết và trắc nghiệm", () => {
  beforeEach(() => {
    mockContents = [];
    mockLessonQuizzes = [];
    mockUseQuiz.mockReset().mockReturnValue({ data: undefined, isError: false });
    mockStartQuiz.mockReset();
    mockSubmitQuiz.mockReset();
  });

  it("bài viết: hiện nội dung đã sanitize (không script/onerror) và thời gian đọc, không phải 'Video không khả dụng'", () => {
    mockContents = [
      {
        id: "c1",
        type: "article",
        title: "Bài đọc",
        display_order: 0,
        reading_time_minutes: 4,
        article_body: '<p>Nội dung an toàn</p><script>window.__pwn=1</script><img src="x" onerror="window.__pwn=2">',
      },
    ];
    const { container } = renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Bài 1" })).toBeTruthy();
    expect(screen.getByText("Nội dung an toàn")).toBeTruthy();
    expect(screen.getByText(/4 phút đọc/)).toBeTruthy();
    expect(container.innerHTML).not.toMatch(/<script|onerror/i);
    expect(screen.queryByText("Video không khả dụng")).toBeNull();
    expect(screen.getByRole("button", { name: /Đánh dấu đã đọc/ })).toBeTruthy();
    // Loại bài của bài đang xem đi vào sidebar từ content (curriculum không trả `type`).
    expect(screen.getByText("les-1:reading")).toBeTruthy();
  });

  it("bài viết: quiz KHÔNG hiện làm nội dung (hàng quiz đứng sau) vẫn nằm trong tab Quiz", () => {
    mockContents = [
      { id: "c1", type: "article", title: "Bài đọc", display_order: 0, article_body: "<p>x</p>" },
      { id: "c2", type: "quiz", title: "Kiểm tra", display_order: 1, quiz_id: "q1" },
    ];
    mockLessonQuizzes = [{ id: "q1", title: "Kiểm tra cuối bài" }];
    renderPage();
    expect(screen.getByTestId("tab-quizzes").textContent).toContain("Kiểm tra cuối bài");
  });

  it("quiz: màn hình bắt đầu lấy quiz THEO quiz_id của content (không phải quizzes[0])", () => {
    mockContents = [{ id: "c2", type: "quiz", title: "Kiểm tra", display_order: 0, quiz_id: "q-b" }];
    mockLessonQuizzes = [
      { id: "q-a", title: "Quiz A (đầu danh sách)" },
      { id: "q-b", title: "Quiz B (đúng quiz_id)" },
    ];
    mockUseQuiz.mockImplementation((id?: string) => ({
      data: id === "q-b" ? { id: "q-b", title: "Quiz B (đúng quiz_id)", max_attempts: 3 } : undefined,
      isError: false,
    }));
    renderPage();

    expect(mockUseQuiz).toHaveBeenCalledWith("q-b");
    expect(screen.getByRole("heading", { name: "Quiz B (đúng quiz_id)" })).toBeTruthy();
    expect(screen.queryByText("Quiz A (đầu danh sách)")).toBeNull();
    expect(screen.getByRole("button", { name: "Bắt đầu làm bài" })).toBeTruthy();
    expect(screen.getByText("les-1:quiz")).toBeTruthy();
  });

  it("quiz không tải được -> thông báo tiếng Việt, nút bắt đầu bị khoá (không im lặng)", () => {
    mockContents = [{ id: "c2", type: "quiz", title: "Kiểm tra", display_order: 0, quiz_id: "q-b" }];
    mockUseQuiz.mockReturnValue({ data: undefined, isError: true });
    renderPage();
    expect(screen.getByText(/Không tải được bài kiểm tra này/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Bắt đầu làm bài" }) as HTMLButtonElement).disabled).toBe(true);
  });
  // H1 (QA 261009): backend hoàn thành bài khi nộp lượt official đạt; nếu web không tải lại curriculum thì
  // sidebar vẫn "chưa xong" và bài kế tiếp vẫn khoá cho tới khi F5.
  it("H1: nộp quiz xong -> tải lại curriculum + tiến độ để bài hiện hoàn thành và bài kế mở khoá", async () => {
    mockContents = [{ id: "c2", type: "quiz", title: "Kiểm tra", display_order: 0, quiz_id: "q-b" }];
    mockUseQuiz.mockReturnValue({ data: { id: "q-b", title: "Kiểm tra", max_attempts: 3 }, isError: false });
    mockStartQuiz.mockResolvedValue({ attempt_id: "att-1", quiz_id: "q-b", title: "Kiểm tra", questions: [] });
    mockSubmitQuiz.mockResolvedValue({ id: "att-1", quiz_id: "q-b", is_passed: true });
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    renderPage(client);

    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu làm bài" }));
    fireEvent.click(await screen.findByRole("button", { name: "nộp-quiz" }));

    await waitFor(() => expect(mockSubmitQuiz).toHaveBeenCalledTimes(1));
    const keys = invalidate.mock.calls.map((c) => (c[0] as { queryKey: unknown }).queryKey);
    expect(keys).toContainEqual(["sections", "course", "course-1"]); // sidebar + khoá bài kế đọc từ đây
    expect(keys).toContainEqual(["courses", "enrolled"]);
    expect(keys).toContainEqual(["enrollments"]); // % tiến độ khoá
  });

  it("H1: nộp quiz LỖI -> không tải lại curriculum (không có gì đổi)", async () => {
    mockContents = [{ id: "c2", type: "quiz", title: "Kiểm tra", display_order: 0, quiz_id: "q-b" }];
    mockUseQuiz.mockReturnValue({ data: { id: "q-b", title: "Kiểm tra" }, isError: false });
    mockStartQuiz.mockResolvedValue({ attempt_id: "att-1", quiz_id: "q-b", title: "Kiểm tra", questions: [] });
    mockSubmitQuiz.mockRejectedValue(new Error("boom"));
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    renderPage(client);

    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu làm bài" }));
    fireEvent.click(await screen.findByRole("button", { name: "nộp-quiz" }));

    await waitFor(() => expect(mockSubmitQuiz).toHaveBeenCalledTimes(1));
    expect(invalidate).not.toHaveBeenCalled();
  });
});
