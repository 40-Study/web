/**
 * Q10 #148 H1: /my-attendance — danh sách HOẶC thống kê toàn bộ còn cache mà refetch nền lỗi: giữ nguyên nhưng PHẢI báo
 * (MỘT thông báo cho cả hai nguồn, trước đây im lặng). Lần tải đầu lỗi vẫn là hộp lỗi.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const attendance = {
  id: "a1", session_id: "s1", student_id: "u1", status: "present",
  check_in_time: "2026-10-07T19:00:00+07:00", created_at: "2026-10-07T19:05:00+07:00",
};
const refetch = vi.fn(async () => undefined);
const refetchAll = vi.fn(async () => undefined);
let list: { data: unknown; isError: boolean };
let all: { data: unknown; isError: boolean };

vi.mock("@/hooks/queries/use-sessions", () => ({
  useMyAttendances: () => ({ ...list, isLoading: false, error: new Error("boom"), refetch }),
  useAllMyAttendances: () => ({ ...all, isLoading: false, refetch: refetchAll }),
}));

import MyAttendancePage from "./page";

const cached = { attendances: [attendance], total: 1 };

beforeEach(() => {
  refetch.mockClear();
  refetchAll.mockClear();
  list = { data: cached, isError: false };
  all = { data: [attendance], isError: false };
});

describe("/my-attendance — Q10 #148 H1", () => {
  it("danh sách refetch lỗi mà còn cache: giữ bảng + thông báo 'Thử lại', không có hộp lỗi", () => {
    list = { data: cached, isError: true };
    render(<MyAttendancePage />);
    expect(screen.getAllByText(/07\/10\/2026 19:00/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được lịch sử điểm danh");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetchAll).not.toHaveBeenCalled();
  });

  it("CẢ HAI nguồn lỗi mà còn cache: vẫn chỉ MỘT thông báo, 'Thử lại' làm mới cả hai", () => {
    list = { data: cached, isError: true };
    all = { data: [attendance], isError: true };
    render(<MyAttendancePage />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetchAll).toHaveBeenCalledTimes(1);
  });

  it("chỉ thống kê toàn bộ lỗi mà còn cache: vẫn báo", () => {
    all = { data: [attendance], isError: true };
    render(<MyAttendancePage />);
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được lịch sử điểm danh");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchAll).toHaveBeenCalledTimes(1);
  });

  it("không lỗi: không có thông báo; lần tải đầu lỗi: hộp lỗi, không phải thông báo dữ liệu cũ", () => {
    const { unmount } = render(<MyAttendancePage />);
    expect(screen.queryByRole("status")).toBeNull();
    unmount();
    list = { data: undefined, isError: true };
    render(<MyAttendancePage />);
    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/Không làm mới được/)).toBeNull();
  });
});
