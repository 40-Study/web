/**
 * Wave-2 W2-8 (Q2-07): ở 1280px (breakpoint `xl`) lưới 3 cột `[320px_360px_1fr]` bị cột 3 (`1fr` = minmax(auto, 1fr))
 * nới theo nút "Tạo bài tập cho buổi học này" (whitespace-nowrap, 271px) làm cả trang tràn ngang 8px.
 * jsdom không có layout nên test này chỉ KHOÁ HAI LỚP CSS gây ra lỗi (đo thật bằng Chrome 1280px: scrollWidth
 * 1288 -> 1280 sau sửa): cột 3 phải được phép co (`min-w-0`) và nút phải được phép xuống dòng.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/stores/auth.store", () => ({ useAuthStore: () => ({ user: { id: "t1" } }) }));
vi.mock("@/hooks/queries/use-courses", () => ({
  useMyCourses: () => ({ data: [{ id: "c1", title: "Khoá 1", status: "published" }], isLoading: false }),
}));
vi.mock("@/hooks/queries/use-livestream-v2", () => ({
  useTeacherLivestreamsForCourse: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/hooks/queries/use-assignments", () => ({
  useAssignmentsBySession: () => ({ data: undefined, isLoading: false, isError: false }),
  useCreateAssignment: () => ({ mutate: vi.fn(), isPending: false }),
  usePublishAssignment: () => ({ mutate: vi.fn(), isPending: false }),
  useUnpublishAssignment: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAssignment: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/components/editor", () => ({ TiptapEditor: () => null }));

// eslint-disable-next-line import/first
import TeacherAssignmentsPage from "./page";

describe("/teacher/assignments — không tràn ngang ở 1280px", () => {
  it("cột 3 của lưới có min-w-0 để co lại thay vì nới theo nút", () => {
    render(<TeacherAssignmentsPage />);
    const button = screen.getByRole("button", { name: /Tạo bài tập cho buổi học này/ });
    const column = button.closest("div.space-y-4");
    expect(column?.className).toContain("min-w-0");
  });

  it("nút 'Tạo bài tập cho buổi học này' được xuống dòng và không vượt khung", () => {
    render(<TeacherAssignmentsPage />);
    const button = screen.getByRole("button", { name: /Tạo bài tập cho buổi học này/ });
    expect(button.className).toContain("whitespace-normal");
    expect(button.className).toContain("max-w-full");
    expect(button.className).not.toMatch(/(^|\s)whitespace-nowrap(\s|$)/);
  });
});
