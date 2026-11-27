/** Q9-T-02: GET /courses/mine lỗi không được trông như "Đã xuất bản (0) — Không có khoá học đang xuất bản". */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetch = vi.fn();
let query: { data: unknown; isLoading: boolean; isError: boolean };

vi.mock("@/hooks/queries/use-courses", () => ({
  useMyCourses: () => ({ ...query, error: new Error("boom"), refetch }),
  useDeleteCourse: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// eslint-disable-next-line import/first
import TeacherCoursesPage from "./page";

beforeEach(() => refetch.mockReset());

describe("/teacher/courses — danh sách lỗi (Q9-T-02)", () => {
  it("hộp lỗi + Thử lại, không có tab đếm 0 hay câu 'Không có khoá học'", () => {
    query = { data: undefined, isLoading: false, isError: true };
    render(<TeacherCoursesPage />);
    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/Không có khoá học/)).toBeNull();
    expect(screen.queryByText(/\(0\)/)).toBeNull();
    // L3: tạo khoá học không phụ thuộc danh sách nên nút vẫn hiện khi GET lỗi.
    expect(screen.getByRole("link", { name: /Tạo khoá học mới/ }).getAttribute("href")).toBe("/teacher/courses/create");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("đối chứng: danh sách rỗng thật vẫn là empty state", () => {
    query = { data: [], isLoading: false, isError: false };
    render(<TeacherCoursesPage />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Không có khoá học đang xuất bản")).toBeTruthy();
  });

  it("refetch nền lỗi mà còn danh sách: giữ khoá học + thông báo 'Thử lại', không có hộp lỗi (Q10 #148 H1)", () => {
    query = { data: [{ id: "c1", title: "QA-Khoa dang 1", status: "published", total_students: 1 }], isLoading: false, isError: true };
    render(<TeacherCoursesPage />);
    expect(screen.getByText("QA-Khoa dang 1")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được danh sách khoá học");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
