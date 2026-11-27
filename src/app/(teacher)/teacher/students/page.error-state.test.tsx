/** Q9-T-02: GET /teachers/me/students lỗi không được trông như "Chưa có học viên nào ghi danh" / "tổng số 0". */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetch = vi.fn();
let query: { data: unknown; isLoading: boolean; isError: boolean };

vi.mock("@/hooks/queries/use-classes", () => ({
  useMyStudents: () => ({ ...query, error: new Error("boom"), refetch }),
}));

// eslint-disable-next-line import/first
import TeacherStudentsPage from "./page";

beforeEach(() => refetch.mockReset());

describe("/teacher/students — danh sách lỗi (Q9-T-02)", () => {
  it("hộp lỗi + Thử lại; không có câu rỗng, không có 'tổng số 0'; nút xuất CSV bị khoá", () => {
    query = { data: undefined, isLoading: false, isError: true };
    render(<TeacherStudentsPage />);
    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/Chưa có học viên nào ghi danh/)).toBeNull();
    expect(screen.queryByText(/trong tổng số/)).toBeNull();
    expect((screen.getByRole("button", { name: /Xuất CSV/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("đối chứng: danh sách rỗng thật vẫn là empty state", () => {
    query = { data: [], isLoading: false, isError: false };
    render(<TeacherStudentsPage />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getAllByText(/Chưa có học viên nào ghi danh/).length).toBeGreaterThan(0);
  });
});
