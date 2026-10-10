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
import { ApiError } from "@/lib/errors";
import { toast } from "sonner";
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
const mockDeleteContent = vi.fn();
vi.mock("@/services/lesson-content.service", () => ({
  lessonContentService: {
    createContent: (...args: unknown[]) => mockCreateContent(...args),
    getContents: vi.fn(),
    deleteContent: (...args: unknown[]) => mockDeleteContent(...args),
    updateContent: vi.fn(),
  },
}));

// Kết quả handleAddContent trả cho modal (T4): true = đóng, false/{error} = giữ modal mở.
const submitState = vi.hoisted(() => ({
  results: [] as unknown[],
  quizQuestions: [] as unknown[],
  // Khác `undefined` thì modal giả gửi đúng payload này thay cho video mặc định.
  payload: undefined as unknown,
}));
const mockQuizCreate = vi.fn();
const mockQuizDelete = vi.fn();
const mockQuizCreateQuestion = vi.fn();
vi.mock("@/services/quiz.service", () => ({
  quizService: {
    create: (...a: unknown[]) => mockQuizCreate(...a),
    delete: (...a: unknown[]) => mockQuizDelete(...a),
    createQuestion: (...a: unknown[]) => mockQuizCreateQuestion(...a),
  },
}));

// Modal thật rất nặng; chỉ cần nút gửi một video hợp lệ khi modal đang mở.
vi.mock("@/components/teacher/add-content-modal", () => ({
  AddContentModal: ({
    open,
    onSubmit,
  }: {
    open: boolean;
    onSubmit: (d: unknown) => unknown;
  }) =>
    open ? (
      <button
        type="button"
        onClick={async () => {
          submitState.results.push(
            await onSubmit(
              submitState.payload ?? {
                type: "video",
                title: "Video mới",
                videoUrl: "https://youtu.be/abc",
                quizQuestions: submitState.quizQuestions,
              },
            ),
          );
        }}
      >
        gui-video
      </button>
    ) : null,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCourseDetailPage from "./page";

function resetMocks() {
  mockInvalidate.mockReset();
  mockCreateContent.mockReset().mockResolvedValue({ id: "ct-new" });
  submitState.results = [];
  submitState.quizQuestions = [];
  submitState.payload = undefined;
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
  mockQuizCreate.mockReset().mockResolvedValue({ id: "quiz-1" });
  mockQuizDelete.mockReset().mockResolvedValue(undefined);
  mockDeleteContent.mockReset().mockResolvedValue(undefined);
  mockQuizCreateQuestion.mockReset().mockResolvedValue({});
}

describe("/teacher/courses/[id] — thêm nội dung làm mới danh sách ngay (B-04)", () => {
  beforeEach(resetMocks);

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


// QA 261008 T4: modal tự đóng + xoá form kể cả khi API lỗi, toast chỉ nói "Không thể thêm nội dung".
describe("/teacher/courses/[id] — kết quả thêm nội dung trả cho modal (T4)", () => {
  async function submitVideo() {
    render(<TeacherCourseDetailPage />);
    fireEvent.click(screen.getByText("Bài 1"));
    fireEvent.click(screen.getByRole("button", { name: /Thêm nội dung/ }));
    fireEvent.click(screen.getByRole("button", { name: "gui-video" }));
    await waitFor(() => expect(submitState.results).toHaveLength(1));
    return submitState.results[0];
  }

  beforeEach(resetMocks);

  it("thành công -> true (modal đóng)", async () => {
    expect(await submitVideo()).toBe(true);
  });

  it("backend 400 -> trả { error } mang lý do tiếng Việt của backend, không phải câu chung", async () => {
    mockCreateContent.mockRejectedValue(new ApiError(400, "UNKNOWN", "title is required"));
    expect(await submitVideo()).toEqual({ error: "Vui lòng nhập tiêu đề" });
  });

  it("video đã tạo nhưng quiz đi kèm lỗi -> gỡ video + quiz dở rồi trả { error } (bấm lưu lại không nhân đôi)", async () => {
    submitState.quizQuestions = [
      { id: "q1", question: "?", correctId: "a", options: [{ id: "a", text: "A" }] },
    ];
    mockQuizCreateQuestion.mockRejectedValue(
      new ApiError(400, "UNKNOWN", "invalid question answers: multiple_choice question must have at least 1 correct answer (got 0)"),
    );
    const result = await submitVideo();
    expect(result).toEqual({ error: "Mỗi câu hỏi trắc nghiệm cần có đáp án đúng trước khi lưu" });
    expect(mockQuizDelete).toHaveBeenCalledWith("quiz-1");
    expect(mockDeleteContent).toHaveBeenCalledWith("les-1", "ct-new");
  });
});


// QA 261008 T2/T5/T7 — quiz và bài viết phải thành hàng lesson_content; một lần lưu = đúng một toast.
describe("/teacher/courses/[id] — nhánh trắc nghiệm và bài viết (T2/T5/T7)", () => {
  const quizPayload = {
    type: "exercise",
    exerciseType: "quiz",
    title: "Kiểm tra Git",
    description: "",
    timeLimit: 600,
    quizQuestions: [
      { id: "q1", question: "Git là gì?", correctId: "a", options: [{ id: "a", text: "VCS" }, { id: "b", text: "IDE" }] },
    ],
  };

  async function submit(payload: unknown) {
    submitState.payload = payload;
    render(<TeacherCourseDetailPage />);
    fireEvent.click(screen.getByText("Bài 1"));
    fireEvent.click(screen.getByRole("button", { name: /Thêm nội dung/ }));
    fireEvent.click(screen.getByRole("button", { name: "gui-video" }));
    await waitFor(() => expect(submitState.results).toHaveLength(1));
    return submitState.results[0];
  }

  beforeEach(resetMocks);

  it("T2: lưu quiz xong thì tạo content type 'quiz' trỏ tới quiz đó, SAU khi câu hỏi đã lưu", async () => {
    expect(await submit(quizPayload)).toBe(true);

    expect(mockCreateContent).toHaveBeenCalledTimes(1);
    expect(mockCreateContent).toHaveBeenCalledWith("les-1", {
      type: "quiz",
      title: "Kiểm tra Git",
      quiz_id: "quiz-1",
      is_mandatory: true,
    });
    expect(mockQuizCreateQuestion.mock.invocationCallOrder[0]).toBeLessThan(
      mockCreateContent.mock.invocationCallOrder[0],
    );
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["lesson-content", "contents", "les-1"] });
  });

  it("T2: tạo content lỗi (409 quiz không thuộc bài) -> xoá quiz vừa tạo, trả { error } của backend", async () => {
    mockCreateContent.mockRejectedValue(
      new ApiError(409, "QUIZ_LESSON_MISMATCH", "Bài kiểm tra không thuộc bài học này"),
    );
    const result = await submit(quizPayload);

    expect(result).toEqual({ error: "Bài kiểm tra không thuộc bài học này" });
    expect(mockQuizDelete).toHaveBeenCalledWith("quiz-1");
    expect(mockInvalidate).not.toHaveBeenCalledWith({ queryKey: ["lesson-content", "contents", "les-1"] });
  });

  it("T5: lưu quiz thành công -> đúng MỘT toast thành công, không có toast lỗi", async () => {
    await submit(quizPayload);
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Đã tạo bài trắc nghiệm");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("T5: lưu quiz thất bại -> đúng MỘT toast lỗi và KHÔNG có toast 'Đã tạo' mâu thuẫn", async () => {
    mockCreateContent.mockRejectedValue(new Error("boom"));
    await submit(quizPayload);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("T7: bài viết -> createContent type 'article' mang article_body, rồi làm mới danh sách", async () => {
    const result = await submit({ type: "article", title: "Bài đọc 1", articleBody: "<p>Nội dung</p>" });

    expect(result).toBe(true);
    expect(mockCreateContent).toHaveBeenCalledWith("les-1", {
      type: "article",
      title: "Bài đọc 1",
      article_body: "<p>Nội dung</p>",
      is_mandatory: true,
    });
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ["lesson-content", "contents", "les-1"] });
    expect(toast.success).toHaveBeenCalledWith("Đã thêm bài viết");
    expect(mockQuizCreate).not.toHaveBeenCalled();
  });

  it("T7: backend từ chối bài viết (400 ARTICLE_BODY_TOO_LONG) -> trả { error } để form giữ nguyên nội dung", async () => {
    mockCreateContent.mockRejectedValue(
      new ApiError(400, "ARTICLE_BODY_TOO_LONG", "Nội dung bài viết quá dài"),
    );
    const result = await submit({ type: "article", title: "Bài đọc 1", articleBody: "<p>x</p>" });
    expect(result).toEqual({ error: "Nội dung bài viết quá dài" });
    expect(toast.success).not.toHaveBeenCalled();
  });
});
