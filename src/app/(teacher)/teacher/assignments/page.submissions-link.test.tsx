/**
 * Q3-03: thẻ bài tập phải có đường dẫn tới /teacher/assignments/{id}/submissions (trước đó trang bài nộp
 * không có lối vào từ UI). Q3-22: hạn nộp không in giây. Q3-20: lưới không còn 3 cột ở 1280px.
 */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("courseId=c1") }));
vi.mock("@/stores/auth.store", () => ({ useAuthStore: () => ({ user: { id: "t1" } }) }));
vi.mock("@/hooks/queries/use-courses", () => ({
  useMyCourses: () => ({ data: [{ id: "c1", title: "Khoá 1", status: "published" }], isLoading: false }),
}));
vi.mock("@/hooks/queries/use-livestream-v2", () => ({
  useTeacherLivestreamsForCourse: () => ({
    data: [{ id: "ses1", title: "Buổi 1", status: "scheduled", scheduled_at: "2026-11-05T03:00:00+07:00" }],
    isLoading: false,
  }),
}));
vi.mock("@/hooks/queries/use-assignments", () => ({
  useAssignmentsBySession: () => ({
    data: {
      data: [
        {
          id: "a-123",
          title: "Bài tập 1",
          description: "<p>mô tả</p>",
          type: "homework",
          is_published: true,
          end_time: "2026-11-10T20:00:00+07:00",
        },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useCreateAssignment: () => ({ mutate: vi.fn(), isPending: false }),
  usePublishAssignment: () => ({ mutate: vi.fn(), isPending: false }),
  useUnpublishAssignment: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAssignment: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/components/editor", () => ({ TiptapEditor: () => null }));

// eslint-disable-next-line import/first
import TeacherAssignmentsPage from "./page";

describe("/teacher/assignments — thẻ bài tập", () => {
  it("có liên kết 'Xem bài nộp' tới trang bài nộp của đúng bài tập", async () => {
    render(<TeacherAssignmentsPage />);
    // chọn buổi học để danh sách bài tập hiện ra
    (await screen.findByText("Buổi 1")).click();
    const link = await screen.findByRole("link", { name: "Xem bài nộp" });
    expect(link.getAttribute("href")).toBe("/teacher/assignments/a-123/submissions");
  });

  it("hạn nộp không có giây", async () => {
    render(<TeacherAssignmentsPage />);
    (await screen.findByText("Buổi 1")).click();
    const card = (await screen.findByText("Bài tập 1")).closest("div.rounded-lg") as HTMLElement;
    expect(within(card).getByText("Hạn nộp: 10/11/2026 20:00")).toBeTruthy();
  });

  it("lưới ngoài không còn 3 cột cố định ở xl", () => {
    const { container } = render(<TeacherAssignmentsPage />);
    expect(container.innerHTML).not.toContain("xl:grid-cols-[320px_360px_1fr]");
    const grid = container.querySelector("div.grid.grid-cols-1.gap-4");
    expect(grid?.className).toContain("lg:grid-cols-2");
  });
});
