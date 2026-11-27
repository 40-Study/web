/**
 * Q10-STU-01 (học viên) / Q10-PG-01 (phụ huynh dùng cùng trang): /notifications tải được, rồi refetch nền lỗi 500.
 * Danh sách đã có phải còn nguyên kèm thông báo "Thử lại" — không bị thay bằng hộp lỗi "Không thể tải dữ liệu".
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/notifications" }));

import NotificationsPage from "./page";
import { ApiError } from "@/lib/errors";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { expectStaleNoticeWithRetry, refetchAllActiveQueries } from "@/test/stale-refetch";
import { renderWithProviders } from "@/test/utils";

const LIST = {
  notifications: [
    { id: "n1", title: "Bài tập mới: Đại số", content: "Hạn nộp 30/11", notification_type: "assignment", reference_type: null, reference_id: null, is_read: false, read_at: null, created_at: "2026-11-26T10:00:00Z" },
  ],
  total: 1,
  unread_count: 1,
  page: 1,
  page_size: 20,
};

let failing = false;
beforeEach(() => {
  resetMockApi();
  failing = false;
  useAuthStore.setState({ isAuthenticated: true, activeRole: "STUDENT" });
  mockApi.get.mockImplementation(async () => {
    if (failing) throw new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
    return envelope(LIST);
  });
});

describe("/notifications — refetch nền lỗi khi đã có danh sách", () => {
  it("giữ danh sách + hiện thông báo 'Thử lại'; bấm thử lại thành công thì thông báo biến mất", async () => {
    const { queryClient } = renderWithProviders(<NotificationsPage />);
    await screen.findByText("Bài tập mới: Đại số");

    failing = true;
    await refetchAllActiveQueries(queryClient);

    await expectStaleNoticeWithRetry();
    expect(screen.getByText("Bài tập mới: Đại số")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();

    failing = false;
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(screen.queryByText(/Không cập nhật được dữ liệu mới/)).toBeNull());
    expect(screen.getByText("Bài tập mới: Đại số")).toBeTruthy();
  });

  it("lần tải ĐẦU lỗi (chưa có dữ liệu) vẫn là hộp lỗi đầy đủ", async () => {
    failing = true;
    renderWithProviders(<NotificationsPage />);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/Không cập nhật được dữ liệu mới/)).toBeNull();
  });
});
