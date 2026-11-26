/**
 * Q7-T06: tiêu đề "Tất cả khoá học (8)" trong khi chỉ 3 khoá đã xuất bản được liệt kê (5 nằm sau nút "Hiện khoá chưa
 * xuất bản (5)"). Con số phải bằng số khoá đang hiện.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/stores/auth.store", () => ({ useAuthStore: () => ({ user: { id: "t1" } }) }));
const course = (id: string, status: string) => ({ id, title: id === "p1" ? "Người mới bắt đầu" : `Khoá ${id}`, status, isPublished: status === "published" });
vi.mock("@/hooks/queries/use-courses", () => ({
  useMyCourses: () => ({
    data: [course("p1", "published"), course("p2", "published"), course("d1", "draft"), course("d2", "draft"), course("d3", "draft")],
    isLoading: false,
  }),
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
vi.mock("@/components/editor", () => ({ TiptapEditor: () => <div /> }));

// eslint-disable-next-line import/first
import TeacherAssignmentsPage from "./page";

describe("/teacher/assignments — số khoá học trên tiêu đề (Q7-T06)", () => {
  it("đếm đúng số khoá đang hiện: 2 đã xuất bản, rồi 5 khi mở nhóm chưa xuất bản", () => {
    render(<TeacherAssignmentsPage />);
    expect(screen.getByText("1) Khoá học của tôi (2)")).toBeTruthy();
    expect(screen.queryByText(/Tất cả khoá học/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Hiện khoá chưa xuất bản \(3\)/ }));
    expect(screen.getByText("1) Khoá học của tôi (5)")).toBeTruthy();
  });
});

describe("/teacher/assignments — ô tìm khoá học (Q8-T01, Q8-T11)", () => {
  it("có tên truy cập và tìm không dấu: 'nguoi moi' ra 'Người mới bắt đầu'", () => {
    render(<TeacherAssignmentsPage />);
    const search = screen.getByRole("textbox", { name: "Tìm khoá học" });
    fireEvent.change(search, { target: { value: " nguoi moi " } });
    expect(screen.getAllByText("Người mới bắt đầu").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Khoá p2")).toHaveLength(0);
  });
});
