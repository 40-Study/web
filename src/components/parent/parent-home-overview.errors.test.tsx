/**
 * Q8-PG-05 (quyết định: lỗi riêng từng widget): thẻ con trên /home hiện "Chưa có dữ liệu tổng quan / Không có bài tập nào sắp tới
 * hạn / Chưa có dữ liệu điểm danh" khi API lỗi. Một widget lỗi không được làm hai widget còn lại báo sai.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetch = { overview: vi.fn(), assignments: vi.fn(), attendance: vi.fn() };
let state: { overviewError: boolean; assignmentsError: boolean; attendanceError: boolean };

vi.mock("@/hooks/queries/use-auth", () => ({
  useChildren: () => ({ data: { children: [{ id: "c1", username: "student1", full_name: "Lê Văn C" }] }, isLoading: false }),
}));
vi.mock("@/hooks/queries/use-parent-dashboard", () => ({
  useChildOverview: () => ({ data: undefined, isLoading: false, isError: state.overviewError, refetch: refetch.overview }),
  useChildAssignments: () => ({
    data: state.assignmentsError ? undefined : { assignments: [] },
    isLoading: false,
    isError: state.assignmentsError,
    refetch: refetch.assignments,
  }),
  useChildAttendance: () => ({
    data: state.attendanceError ? undefined : { records: [] },
    isLoading: false,
    isError: state.attendanceError,
    refetch: refetch.attendance,
  }),
}));

import { ParentHomeOverview } from "./parent-home-overview";

beforeEach(() => {
  Object.values(refetch).forEach((fn) => fn.mockReset());
  state = { overviewError: false, assignmentsError: false, attendanceError: false };
});

describe("ParentHomeOverview — lỗi theo widget (Q8-PG-05)", () => {
  it("cả ba lỗi: ba thông báo lỗi riêng, không câu 'chưa có dữ liệu'", () => {
    state = { overviewError: true, assignmentsError: true, attendanceError: true };
    render(<ParentHomeOverview />);

    const alerts = screen.getAllByRole("alert").map((a) => a.textContent);
    expect(alerts).toEqual([
      expect.stringContaining("Không tải được tổng quan"),
      expect.stringContaining("Không tải được bài tập"),
      expect.stringContaining("Không tải được điểm danh"),
    ]);
    expect(screen.queryByText(/Chưa có dữ liệu/)).toBeNull();
    expect(screen.queryByText(/Không có bài tập nào sắp tới hạn/)).toBeNull();
  });

  it("chỉ điểm danh lỗi: bài tập vẫn nói 'không có bài tập', Thử lại gọi đúng query", () => {
    state = { overviewError: false, assignmentsError: false, attendanceError: true };
    render(<ParentHomeOverview />);

    expect(screen.getByText("Không có bài tập nào sắp tới hạn.")).toBeTruthy();
    const alert = within(screen.getByRole("alert"));
    fireEvent.click(alert.getByRole("button", { name: "Thử lại" }));
    expect(refetch.attendance).toHaveBeenCalledTimes(1);
    expect(refetch.assignments).not.toHaveBeenCalled();
  });

  it("không lỗi: giữ nguyên các câu rỗng cũ", () => {
    render(<ParentHomeOverview />);
    expect(screen.getByText("Chưa có dữ liệu tổng quan.")).toBeTruthy();
    expect(screen.getByText("Chưa có dữ liệu điểm danh.")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
