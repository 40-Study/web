/**
 * Q10 #148 H1: /my-assignments tải được, rồi refetch nền lỗi: danh sách bài tập đang xem phải còn nguyên VÀ có thông báo
 * "Thử lại" (trước đây giữ im lặng). Lần tải đầu lỗi vẫn là hộp lỗi.
 */
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const future = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
const base = {
  id: "a1", title: "Bài một", description: "", language: ["python"], is_published: true, end_time: future,
  allow_late_submission: false, max_late_days: 0, grace_period_minutes: 0,
};

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { user?: { id: string } }) => unknown) => selector({ user: { id: "student-1" } }),
}));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import MyAssignmentsPage from "./page";
import { ApiError } from "@/lib/errors";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { expectStaleNoticeWithRetry, refetchAllActiveQueries } from "@/test/stale-refetch";
import { renderWithProviders } from "@/test/utils";

let failing = false;
beforeEach(() => {
  resetMockApi();
  failing = false;
  mockApi.get.mockImplementation(async () => {
    if (failing) throw new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
    return { data: { data: [base], total: 1, page: 1, page_size: 100 } };
  });
});

describe("/my-assignments — Q10 #148 H1", () => {
  it("refetch nền lỗi: còn bài tập + thông báo 'Thử lại' (bấm là gọi lại)", async () => {
    const { queryClient } = renderWithProviders(<MyAssignmentsPage />);
    await screen.findByText("Bài một");

    failing = true;
    await refetchAllActiveQueries(queryClient);

    await expectStaleNoticeWithRetry();
    expect(screen.getByText("Bài một")).toBeTruthy();
    expect(screen.queryByText("Chưa tải được danh sách bài tập.")).toBeNull();

    const calls = mockApi.get.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await screen.findByRole("button", { name: "Đang tải lại…" });
    expect(mockApi.get.mock.calls.length).toBeGreaterThan(calls);
  });

  it("lần tải đầu lỗi: hộp lỗi, không có thông báo dữ liệu cũ", async () => {
    failing = true;
    renderWithProviders(<MyAssignmentsPage />);
    expect((await screen.findByRole("alert")).textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/Không làm mới được/)).toBeNull();
  });
});
