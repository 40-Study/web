/**
 * Q7-T01 (C12): thời lượng bài học là số phút nguyên 0..1440. Trước đây "-5", "2.5" (lặng lẽ thành 2) và
 * "99999999999" đều được gửi đi; `min={0}` không có `<form>` nên không bao giờ được kiểm.
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


async function openLessonDialog() {
  render(<TeacherCourseDetailPage />);
  fireEvent.click(screen.getByRole("button", { name: /Thêm bài học/ }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(within(dialog).getByPlaceholderText("VD: Cú pháp cơ bản"), { target: { value: "Bài 1" } });
  return dialog;
}

describe("/teacher/courses/[id] - thời lượng bài học (Q7-T01)", () => {
  beforeEach(() => {
    cache.data.clear();
    cache.server.clear();
    cache.data.set(JSON.stringify(["sections", "course-1"]), [{ id: "sec-1", title: "Chương 1", order: 1, lessons: [] }]);
    createLesson.mockReset().mockResolvedValue({ id: "les-1" });
  });

  // "1e", "-", "2." là những gì ô type="number" của trình duyệt đọc thành "" (bị coi là để trống): ô phải là text.
  it.each(["-5", "2.5", "99999999999", "1e", "-", "2.", "abc"])("%s: báo lỗi dưới ô, khoá nút tạo, không gửi", async (value) => {
    const dialog = await openLessonDialog();
    fireEvent.change(within(dialog).getByLabelText("Thời lượng (phút)"), { target: { value } });

    expect(within(dialog).getByRole("alert").textContent).toContain("từ 0 đến 1440");
    const create = within(dialog).getByRole("button", { name: "Tạo bài học" }) as HTMLButtonElement;
    expect(create.disabled).toBe(true);
    fireEvent.click(create);
    expect(createLesson).not.toHaveBeenCalled();
  });

  it("45 phút hợp lệ: gửi duration_minutes = 45", async () => {
    const dialog = await openLessonDialog();
    fireEvent.change(within(dialog).getByLabelText("Thời lượng (phút)"), { target: { value: "45" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Tạo bài học" }));
    await waitFor(() => expect(createLesson).toHaveBeenCalledTimes(1));
    expect(createLesson.mock.calls[0][0]).toMatchObject({ title: "Bài 1", duration_minutes: 45 });
  });

  it("để trống: không gửi khoá duration_minutes", async () => {
    const dialog = await openLessonDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Tạo bài học" }));
    await waitFor(() => expect(createLesson).toHaveBeenCalledTimes(1));
    expect(createLesson.mock.calls[0][0].duration_minutes).toBeUndefined();
  });
});
