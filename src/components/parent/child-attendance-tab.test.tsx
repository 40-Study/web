/**
 * Q5-PG-01: ô thống kê điểm danh phải là số trên toàn bộ buổi (backend C3) và danh sách phải có "Xem thêm".
 * Q5-PG-03: hiện giờ vào lớp.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppQueryClient } from "@/lib/query-client";
import { ApiError } from "@/lib/errors";
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

  // Q6-PG-09: ở 390px cột phải bị ép nên "Vào lúc 08:30" / "Trễ 12 phút" gãy thành 2-3 dòng.
  it("cột trạng thái không co và không bẻ dòng", async () => {
    renderTab();
    const block = (await screen.findAllByTestId("attendance-status-block"))[0];
    expect(block.className).toContain("shrink-0");
    expect(block.className).toContain("whitespace-nowrap");
  });

  it("không có bản ghi: hiện câu rỗng, không có nút", async () => {
    getChildAttendance.mockResolvedValue({ ...page(1, []), total: 0 });
    renderTab();
    expect(await screen.findByText("Chưa có dữ liệu điểm danh")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Xem thêm" })).toBeNull();
  });

  // Review L1: lỗi 4xx để react-query không tự retry (test chạy nhanh); lỗi mạng/5xx dùng cùng đường hiển thị.
  const failure = () => new ApiError(400, "ERR_BAD_REQUEST", "boom");

  it("trang 1 lỗi: chỉ hiện câu lỗi, không hiện thêm 'Chưa có dữ liệu điểm danh'", async () => {
    getChildAttendance.mockRejectedValue(failure());
    renderTab();
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/Không tải được dữ liệu điểm danh/)).toBeTruthy();
    expect(screen.queryByText("Chưa có dữ liệu điểm danh")).toBeNull();
  });

  it("Q9-PG-04: trang 1 lỗi vẫn có nút 'Thử lại'; bấm thì tải lại và hiện danh sách", async () => {
    getChildAttendance.mockRejectedValue(failure());
    renderTab();
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByText(/Đang hiện 0\/0/)).toBeNull();

    getChildAttendance.mockImplementation((_id: string, p: number) =>
      Promise.resolve(page(p, Array.from({ length: 20 }, (_, i) => rec(i + 1)))),
    );
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(20));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("trang sau lỗi: giữ nút, thành 'Thử lại', bấm thì tải lại đúng trang hỏng", async () => {
    renderTab();
    await screen.findByRole("button", { name: "Xem thêm" });
    getChildAttendance.mockImplementation((_id: string, p: number) =>
      p === 1 ? Promise.resolve(page(1, Array.from({ length: 20 }, (_, i) => rec(i + 1)))) : Promise.reject(failure()),
    );
    fireEvent.click(screen.getByRole("button", { name: "Xem thêm" }));
    const retryButton = await screen.findByRole("button", { name: "Thử lại" });
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(20);

    getChildAttendance.mockImplementation((_id: string, p: number) =>
      Promise.resolve(p === 1 ? page(1, Array.from({ length: 20 }, (_, i) => rec(i + 1))) : page(2, Array.from({ length: 5 }, (_, i) => rec(21 + i)))),
    );
    fireEvent.click(retryButton);
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(25));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  // Review L2: bản ghi mới thêm giữa hai lần "Xem thêm" đẩy r20 sang trang 2 -> không được lặp dòng.
  it("bản ghi trùng giữa hai trang chỉ hiện một lần", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    getChildAttendance.mockImplementation((_id: string, p: number) =>
      Promise.resolve(
        p === 1
          ? page(1, Array.from({ length: 20 }, (_, i) => rec(i + 1)))
          : page(2, [rec(20), ...Array.from({ length: 4 }, (_, i) => rec(21 + i))]),
      ),
    );
    renderTab();
    fireEvent.click(await screen.findByRole("button", { name: "Xem thêm" }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(24));
    expect(screen.getAllByText("Lớp 20")).toHaveLength(1);
    expect(errors.mock.calls.some((c) => String(c[0]).includes("same key"))).toBe(false);
    errors.mockRestore();
  });
});
