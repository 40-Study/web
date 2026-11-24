/**
 * Q5-PG-01: ô thống kê điểm danh phải là số trên toàn bộ buổi (backend C3) và danh sách phải có "Xem thêm".
 * Q5-PG-03: hiện giờ vào lớp.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppQueryClient } from "@/lib/query-client";
import type { ChildAttendance, ChildAttendanceResponse } from "@/services/parent-dashboard.service";

const getChildAttendance = vi.fn();
vi.mock("@/services/parent-dashboard.service", () => ({
  parentDashboardService: { getChildAttendance: (...a: unknown[]) => getChildAttendance(...a) },
}));

import { ChildAttendanceTab } from "./child-attendance-tab";

const rec = (n: number, extra: Partial<ChildAttendance> = {}): ChildAttendance => ({
  id: `r${n}`,
  class_id: "c1",
  class_name: `Lớp ${n}`,
  session_number: n,
  date: "2026-11-10T00:00:00Z",
  status: "present",
  late_minutes: 0,
  ...extra,
});

const stats = { total_sessions: 25, present_count: 20, absent_count: 2, late_count: 2, excused_count: 1, attendance_rate: 88 };
const page = (p: number, records: ChildAttendance[]): ChildAttendanceResponse => ({
  records,
  stats,
  total: 25,
  page: p,
  page_size: 20,
});

const renderTab = () =>
  render(
    <QueryClientProvider client={createAppQueryClient()}>
      <ChildAttendanceTab childId="child-1" />
    </QueryClientProvider>,
  );

beforeEach(() => {
  getChildAttendance.mockReset();
  getChildAttendance.mockImplementation((_id: string, p: number) =>
    Promise.resolve(
      p === 1
        ? page(1, Array.from({ length: 20 }, (_, i) => rec(i + 1, i === 0 ? { check_in_time: "19:05", status: "late", late_minutes: 5 } : {})))
        : page(2, Array.from({ length: 5 }, (_, i) => rec(21 + i))),
    ),
  );
});

describe("ChildAttendanceTab", () => {
  it("ô thống kê lấy từ backend (toàn bộ buổi), không đếm lại trên trang", async () => {
    renderTab();
    expect(await screen.findByText("25")).toBeTruthy(); // Tổng buổi
    expect(screen.getByText("88%")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(20);
  });

  it("'Xem thêm' tải trang kế và ẩn đi khi đã hiện đủ", async () => {
    renderTab();
    fireEvent.click(await screen.findByRole("button", { name: "Xem thêm" }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(25));
    expect(getChildAttendance).toHaveBeenCalledWith("child-1", 2, 20);
    expect(screen.queryByRole("button", { name: "Xem thêm" })).toBeNull();
  });

  it("hiện giờ vào lớp khi có", async () => {
    renderTab();
    expect(await screen.findByText("Vào lúc 19:05")).toBeTruthy();
    expect(screen.getAllByText(/Vào lúc/)).toHaveLength(1);
  });

  it("không có bản ghi: hiện câu rỗng, không có nút", async () => {
    getChildAttendance.mockResolvedValue({ ...page(1, []), total: 0 });
    renderTab();
    expect(await screen.findByText("Chưa có dữ liệu điểm danh")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Xem thêm" })).toBeNull();
  });
});
