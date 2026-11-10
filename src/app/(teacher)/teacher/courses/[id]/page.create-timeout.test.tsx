/**
 * QA-B-03 (261110): tạo bài học khi request quá 15s — server vẫn tạo xong nhưng UI không cập nhật, promise lỗi không
 * được bắt (dev overlay "1 error"), bấm lại thì ra bài trùng. Giờ: timeout thì tải lại danh sách từ server và đối
 * chiếu; thấy bài mới -> báo đã lưu + đóng hộp thoại; chưa thấy -> "Chưa rõ kết quả", giữ hộp thoại.
 */

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NetworkError } from "@/lib/errors";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "course-1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

// Cache giả của react-query: refetch = đọc "dữ liệu trên server" hiện tại vào cache.
const cache = vi.hoisted(() => ({ data: new Map<string, unknown>(), server: new Map<string, unknown>() }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    getQueryData: (key: unknown[]) => cache.data.get(JSON.stringify(key)),
    refetchQueries: async ({ queryKey }: { queryKey: unknown[] }) => {
      const k = JSON.stringify(queryKey);
      cache.data.set(k, cache.server.get(k));
    },
  }),
}));

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
  useSections: () => ({ data: [{ id: "sec-1", title: "Chương 1", order: 1, lessons: [] }], isLoading: false }),
  sectionKeys: { byCourse: (id: string) => ["sections", id] },
  useCreateSection: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderSections: () => ({ mutate: vi.fn() }),
  useDeleteSection: () => ({ mutate: vi.fn() }),
}));
const createLesson = vi.fn();
vi.mock("@/hooks/queries/use-lessons", () => ({
  useLessons: () => ({ data: [], isLoading: false }),
  lessonKeys: { bySection: (c: string, s: string) => ["lessons", "section", c, s] },
  useCreateLesson: () => ({ mutateAsync: createLesson, isPending: false }),
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

const SECTIONS_KEY = JSON.stringify(["sections", "course-1"]);
const sectionWith = (lessons: { id: string; title: string }[]) => [{ id: "sec-1", title: "Chương 1", order: 1, lessons }];

async function submitLesson(title: string) {
  render(<TeacherCourseDetailPage />);
  fireEvent.click(screen.getByRole("button", { name: /Thêm bài học/ }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(within(dialog).getByPlaceholderText("VD: Cú pháp cơ bản"), { target: { value: title } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Tạo bài học" }));
  return dialog;
}

describe("/teacher/courses/[id] — tạo bài học khi request timeout (QA-B-03)", () => {
  beforeEach(() => {
    cache.data.clear();
    cache.server.clear();
    cache.data.set(SECTIONS_KEY, sectionWith([]));
    createLesson.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.warning).mockClear();
  });

  it("server đã tạo xong dù client timeout -> báo đã lưu, đóng hộp thoại, không báo lỗi", async () => {
    createLesson.mockImplementation(async () => {
      cache.server.set(SECTIONS_KEY, sectionWith([{ id: "les-new", title: "QA-261110-Bai 1" }]));
      throw new NetworkError();
    });

    await submitLesson("QA-261110-Bai 1");

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(toast.success).toHaveBeenCalledWith("Đã tạo bài học", expect.anything());
    expect(toast.warning).not.toHaveBeenCalled();
    expect(createLesson).toHaveBeenCalledTimes(1);
  });

  it("server chưa có bài -> 'Chưa rõ kết quả', giữ hộp thoại và nội dung đã nhập", async () => {
    createLesson.mockRejectedValue(new NetworkError());
    cache.server.set(SECTIONS_KEY, sectionWith([]));

    const dialog = await submitLesson("QA-261110-Bai 2");

    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith("Chưa rõ kết quả", expect.anything()));
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect((within(dialog).getByPlaceholderText("VD: Cú pháp cơ bản") as HTMLInputElement).value).toBe("QA-261110-Bai 2");
    expect(toast.success).not.toHaveBeenCalled();
  });
});
