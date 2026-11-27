/** Q10 #148 H1: /livestream tải được, rồi refetch nền lỗi: giữ danh sách buổi học + thông báo 'Thử lại' (trước đây im lặng). */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import StudentLivestreamPage from "./page";
import { ApiError } from "@/lib/errors";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { expectStaleNoticeWithRetry, refetchAllActiveQueries } from "@/test/stale-refetch";
import { renderWithProviders } from "@/test/utils";

const session = {
  id: "now", title: "Buổi đang diễn ra", status: "live", scheduled_at: "2026-10-03T19:00:00+07:00", description: "", host_id: "h",
  class_id: "c", room_name: "r", max_viewers: 100, is_recorded: false, settings: "{}", created_at: "2026-10-01T00:00:00+07:00",
};

let failing = false;
beforeEach(() => {
  resetMockApi();
  failing = false;
  mockApi.get.mockImplementation(async () => {
    if (failing) throw new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
    return { data: { data: [session], total: 1, page: 1, page_size: 50 } };
  });
});

describe("/livestream — Q10 #148 H1", () => {
  it("refetch nền lỗi: còn buổi học + thông báo 'Thử lại', không có hộp lỗi", async () => {
    const { queryClient } = renderWithProviders(<StudentLivestreamPage />);
    await screen.findByText("Buổi đang diễn ra");
    failing = true;
    await refetchAllActiveQueries(queryClient);
    await expectStaleNoticeWithRetry();
    expect(screen.getByText("Buổi đang diễn ra")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("lần tải đầu lỗi: hộp lỗi, không có thông báo dữ liệu cũ", async () => {
    failing = true;
    renderWithProviders(<StudentLivestreamPage />);
    expect((await screen.findByRole("alert")).textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/Không làm mới được/)).toBeNull();
  });
});
