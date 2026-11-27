/**
 * Q10 #148 H1/M3: thẻ con ở /home còn cache mà refetch nền lỗi: giữ số liệu + MỘT thông báo 'Thử lại' cho mỗi thẻ (không
 * một thanh cho mỗi widget). Nguồn lỗi lần đầu vẫn là lỗi riêng của widget (parent-home-overview.errors.test.tsx).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetch = { overview: vi.fn(async () => undefined), assignments: vi.fn(async () => undefined), attendance: vi.fn(async () => undefined) };
let failing: { overview: boolean; assignments: boolean; attendance: boolean };

vi.mock("@/hooks/queries/use-auth", () => ({
  useChildren: () => ({ data: { children: [{ id: "c1", username: "student1", full_name: "Lê Văn C" }] }, isLoading: false }),
}));
vi.mock("@/hooks/queries/use-parent-dashboard", () => ({
  useChildOverview: () => ({
    data: { id: "c1", enrolled_courses: 3, completed_courses: 1, total_study_minutes: 120, current_streak: 4 },
    isLoading: false,
    isError: failing.overview,
    refetch: refetch.overview,
  }),
  useChildAssignments: () => ({ data: { assignments: [] }, isLoading: false, isError: failing.assignments, refetch: refetch.assignments }),
  useChildAttendance: () => ({ data: { records: [] }, isLoading: false, isError: failing.attendance, refetch: refetch.attendance }),
}));

import { ParentHomeOverview } from "./parent-home-overview";

beforeEach(() => {
  Object.values(refetch).forEach((fn) => fn.mockClear());
  failing = { overview: false, assignments: false, attendance: false };
});

describe("ParentHomeOverview — refetch lỗi mà còn cache (Q10 #148)", () => {
  it("không lỗi: không có thông báo", () => {
    render(<ParentHomeOverview />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("H1: chỉ tổng quan lỗi mà còn cache: giữ số liệu + thông báo, retry chỉ tổng quan", () => {
    failing.overview = true;
    render(<ParentHomeOverview />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được dữ liệu của Lê Văn C");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch.overview).toHaveBeenCalledTimes(1);
    expect(refetch.assignments).not.toHaveBeenCalled();
  });

  it("M3: cả ba nguồn lỗi mà còn cache: MỘT thông báo cho thẻ, retry làm mới cả ba", () => {
    failing = { overview: true, assignments: true, attendance: true };
    render(<ParentHomeOverview />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    Object.values(refetch).forEach((fn) => expect(fn).toHaveBeenCalledTimes(1));
  });
});
