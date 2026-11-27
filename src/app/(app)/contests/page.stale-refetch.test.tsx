/**
 * Q10-PG-01 (khách): /contests tải được, rồi refetch nền lỗi 500: giữ danh sách cuộc thi + báo gọn "Thử lại", không thay
 * cả danh sách bằng "Không tải được danh sách cuộc thi". Lần tải đầu lỗi vẫn là khối lỗi.
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: { ...mockApi, request: vi.fn() } };
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import ContestsPage from "./page";
import { api } from "@/lib/api-client";
import { ApiError } from "@/lib/errors";
import { expectStaleNoticeWithRetry, refetchAllActiveQueries } from "@/test/stale-refetch";
import { renderWithProviders } from "@/test/utils";

const CONTEST = {
  id: "c1", slug: "thi-thu", title: "Thi thử Toán học kỳ", description: "", type: "QUIZ", phase: "UPCOMING",
  start_time: "2026-11-30T01:00:00Z", end_time: "2026-12-10T01:00:00Z", duration_minutes: 45,
  question_count: 5, total_points: 10, participant_count: 0, max_participants: 0,
  prizes: [], has_voucher_prize: false, course: null,
};

const request = api.request as unknown as ReturnType<typeof vi.fn>;
let failing = false;
beforeEach(() => {
  request.mockReset();
  failing = false;
  request.mockImplementation(async () => {
    if (failing) throw new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
    return { status: 200, data: { message: "ok", data: { items: [CONTEST], total: 1, page: 1, total_pages: 1 } } };
  });
});

describe("/contests (khách) — Q10-PG-01", () => {
  it("refetch nền lỗi: danh sách cuộc thi còn nguyên + thông báo 'Thử lại'", async () => {
    const { queryClient } = renderWithProviders(<ContestsPage />);
    await screen.findByText("Thi thử Toán học kỳ");

    failing = true;
    await refetchAllActiveQueries(queryClient);

    await expectStaleNoticeWithRetry();
    expect(screen.getByText("Thi thử Toán học kỳ")).toBeTruthy();
    expect(screen.queryByText("Không tải được danh sách cuộc thi")).toBeNull();
  });

  it("lần tải đầu lỗi: khối lỗi, không có thông báo dữ liệu cũ", async () => {
    failing = true;
    renderWithProviders(<ContestsPage />);
    await screen.findByText("Không tải được danh sách cuộc thi");
    expect(screen.queryByText(/Không cập nhật được dữ liệu mới/)).toBeNull();
  });
});
