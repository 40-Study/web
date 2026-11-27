/** Q9-T-02: GET /courses/mine lỗi không được trông như "1) Khoá học của tôi (0) — Không có khoá học phù hợp". */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/stores/auth.store", () => ({ useAuthStore: () => ({ user: { id: "t1" } }) }));
const refetch = vi.fn();
let query: { data: unknown; isLoading: boolean; isError: boolean };
vi.mock("@/hooks/queries/use-courses", () => ({
  useMyCourses: () => ({ ...query, error: new Error("boom"), refetch }),
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

beforeEach(() => refetch.mockReset());

describe("/teacher/assignments — danh sách khoá lỗi (Q9-T-02)", () => {
  it("hộp lỗi + Thử lại, tiêu đề không có (0), không có câu 'Không có khoá học phù hợp'", () => {
    query = { data: undefined, isLoading: false, isError: true };
    render(<TeacherAssignmentsPage />);
    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.getByText("1) Khoá học của tôi")).toBeTruthy();
    expect(screen.queryByText(/Không có khoá học phù hợp/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("đối chứng: danh sách rỗng thật vẫn là 'Không có khoá học phù hợp' kèm (0)", () => {
    query = { data: [], isLoading: false, isError: false };
    render(<TeacherAssignmentsPage />);
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    expect(screen.getByText("1) Khoá học của tôi (0)")).toBeTruthy();
    expect(screen.getByText("Không có khoá học phù hợp.")).toBeTruthy();
  });
});
