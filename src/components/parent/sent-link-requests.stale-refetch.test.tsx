/**
 * Q10-PG-01 (phụ huynh): "Yêu cầu đã gửi" ở /settings/family tải được, rồi refetch nền lỗi 500: giữ danh sách + báo gọn
 * "Thử lại" thay vì thay bằng "Không tải được yêu cầu đã gửi". Lần tải đầu lỗi vẫn là dòng lỗi có "Thử lại".
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { SentLinkRequests } from "./sent-link-requests";
import { ApiError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { expectStaleNoticeWithRetry, refetchAllActiveQueries } from "@/test/stale-refetch";
import { renderWithProviders } from "@/test/utils";

const REQUEST = { id: "r1", status: "pending", relationship: "parent", student_email: "con.hoc@example.com", created_at: "2026-11-25T08:00:00Z" };

let failing = false;
beforeEach(() => {
  resetMockApi();
  failing = false;
  mockApi.get.mockImplementation(async () => {
    if (failing) throw new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
    return envelope([REQUEST]);
  });
});

describe("SentLinkRequests — Q10-PG-01", () => {
  it("refetch nền lỗi: danh sách yêu cầu còn nguyên + thông báo 'Thử lại'", async () => {
    const { queryClient } = renderWithProviders(<SentLinkRequests />);
    await screen.findByText("con.hoc@example.com");

    failing = true;
    await refetchAllActiveQueries(queryClient);

    await expectStaleNoticeWithRetry();
    expect(screen.getByText("con.hoc@example.com")).toBeTruthy();
    expect(screen.queryByText(/Không tải được yêu cầu đã gửi/)).toBeNull();
  });

  it("lần tải đầu lỗi: dòng lỗi + 'Thử lại', không có thông báo dữ liệu cũ", async () => {
    failing = true;
    renderWithProviders(<SentLinkRequests />);
    await screen.findByText(/Không tải được yêu cầu đã gửi/);
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
    expect(screen.queryByText(/Không cập nhật được dữ liệu mới/)).toBeNull();
  });
});
