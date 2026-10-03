/**
 * A-07 (QA hồi quy 03/10/2026): học viên không có chỗ nào xem điểm của mình và ai chấm — `GET /me/grades`
 * trả đủ dữ liệu nhưng không trang nào gọi. Trang "Điểm của tôi" phải hiện điểm, nhận xét, người chấm theo lớp.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Grade } from "@/services/grade.service";

let mockState: { data?: Grade[]; isLoading: boolean; error: unknown };
const refetch = vi.fn();

vi.mock("@/hooks/queries/use-grades", () => ({
  useMyGrades: () => ({ ...mockState, refetch }),
}));

// eslint-disable-next-line import/first
import MyGradesPage from "./page";

function grade(over: Partial<Grade>): Grade {
  return {
    id: "g1",
    class_id: "c1",
    class_name: "Lớp ReactJS K12 - Tối 2-4-6",
    student_id: "u1",
    grade_type: "assignment",
    title: "Bài tập: Tính tổng giỏ hàng",
    score: 10,
    max_score: 10,
    feedback: "Dùng filter + reduce rất gọn.",
    graded_by: "t1",
    graded_by_name: "Nguyễn Văn A",
    graded_at: "2026-09-22T23:59:00+07:00",
    ...over,
  };
}

describe("/my-grades — Điểm của tôi", () => {
  beforeEach(() => {
    refetch.mockReset();
    mockState = { data: [], isLoading: false, error: null };
  });

  it("hiện điểm, nhận xét và người chấm, nhóm theo lớp", () => {
    mockState = {
      isLoading: false,
      error: null,
      data: [
        grade({}),
        grade({ id: "g2", title: "Kiểm tra giữa kỳ", score: 6, max_score: 10, graded_by_name: "Trần Thị B", feedback: "Cần ôn thêm" }),
        grade({ id: "g3", class_id: "c2", class_name: "Lớp Python Data K3", title: "Bài tập: Top 5", score: 5, max_score: 10, graded_by_name: "Trần Thị B" }),
      ],
    };
    render(<MyGradesPage />);

    const react = screen.getByRole("region", { name: "Lớp ReactJS K12 - Tối 2-4-6" });
    expect(within(react).getByText("Bài tập: Tính tổng giỏ hàng")).toBeTruthy();
    expect(within(react).getByText("10/10")).toBeTruthy();
    expect(within(react).getByText(/Chấm bởi Nguyễn Văn A/)).toBeTruthy();
    expect(within(react).getByText("Dùng filter + reduce rất gọn.")).toBeTruthy();
    expect(within(react).getByText(/Chấm bởi Trần Thị B/)).toBeTruthy();

    const python = screen.getByRole("region", { name: "Lớp Python Data K3" });
    expect(within(python).getByText("5/10")).toBeTruthy();
    // Điểm của lớp này không lẫn vào lớp kia
    expect(within(python).queryByText("Bài tập: Tính tổng giỏ hàng")).toBeNull();
  });

  it("chưa có điểm: nói rõ khi nào sẽ có, không để trang trống", () => {
    render(<MyGradesPage />);
    expect(screen.getByText(/Bạn chưa có điểm nào/)).toBeTruthy();
  });

  it("lỗi tải: báo lỗi và cho thử lại", () => {
    mockState = { isLoading: false, error: new Error("boom") };
    render(<MyGradesPage />);

    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("có đường quay về Bài tập của tôi", () => {
    render(<MyGradesPage />);
    expect(screen.getByRole("link", { name: /Bài tập của tôi/ }).getAttribute("href")).toBe("/my-assignments");
  });
});
