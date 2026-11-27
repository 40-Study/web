/**
 * Q10 #148 L1/L3: lỗi của /leaderboard/me KHÔNG biến cả bảng thành "lỗi" hay "dữ liệu cũ". Bảng đã tải xong vẫn đúng, chỉ thiếu
 * hạng của mình, và câu thông báo nói đúng điều đó. Bảng còn cache mà refetch lỗi thì giữ bảng + 'Thử lại'.
 */
import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import LeaderboardPage from "./page";
import { ApiError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { refetchAllActiveQueries, staleNoticeCount } from "@/test/stale-refetch";
import { renderWithProviders } from "@/test/utils";
import { useAuthStore } from "@/stores/auth.store";

const ME = "11111111-1111-4111-8111-111111111111";
const ENTRIES = [
  { rank: 1, user_id: "22222222-2222-4222-8222-222222222222", user_name: "binh", full_name: "Bình Công Khai", display_name: "Bình Công Khai", points: 90 },
  { rank: 2, user_id: ME, user_name: "toi", full_name: "Tôi Là Tôi", display_name: "Tôi Là Tôi", points: 70, is_me: true },
];
const fail = () => new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");

let boardFails = false;
let rankFails = false;
beforeEach(() => {
  resetMockApi();
  boardFails = false;
  rankFails = false;
  useAuthStore.setState({ isAuthenticated: true, sessionStatus: "authenticated" });
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/leaderboard/classes") return envelope([]);
    if (url === "/leaderboard/me") {
      if (rankFails) throw fail();
      return envelope({ period_type: "weekly", period: "2026-W41", entry: ENTRIES[1] });
    }
    if (boardFails) throw fail();
    return envelope({ period_type: "weekly", period: "2026-W41", total: 2, entries: ENTRIES });
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  useAuthStore.getState().clearServerSession();
});

describe("/leaderboard — Q10 #148", () => {
  it("L1: hạng của mình lỗi LẦN ĐẦU, bảng đã tải: giữ bảng, thông báo nêu đúng 'hạng của bạn', KHÔNG hộp lỗi / 'dữ liệu cũ'", async () => {
    rankFails = true;
    renderWithProviders(<LeaderboardPage />);
    expect(await screen.findByText(/Chưa tải được hạng của bạn/)).toBeTruthy();
    expect(screen.getAllByText("Bình Công Khai").length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText(/Đang hiển thị dữ liệu cũ/)).toBeNull();
  });

  it("bảng còn cache mà refetch lỗi: giữ bảng + MỘT thông báo 'dữ liệu cũ' + 'Thử lại'", async () => {
    const { queryClient } = renderWithProviders(<LeaderboardPage />);
    await screen.findAllByText("Bình Công Khai");
    boardFails = true;
    await refetchAllActiveQueries(queryClient);
    expect(await screen.findByText(/Không cập nhật được dữ liệu mới/)).toBeTruthy();
    expect(staleNoticeCount()).toBe(1);
    expect(screen.getAllByText("Bình Công Khai").length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("cả bảng lẫn hạng cùng lỗi mà còn cache: vẫn MỘT thông báo; 'Thử lại' làm mới cả hai và hiện trạng thái bận", async () => {
    const { queryClient } = renderWithProviders(<LeaderboardPage />);
    await screen.findAllByText("Bình Công Khai");
    boardFails = true;
    rankFails = true;
    await refetchAllActiveQueries(queryClient);
    await screen.findByText(/Không cập nhật được dữ liệu mới/);
    expect(screen.getAllByRole("button", { name: "Thử lại" })).toHaveLength(1);
    const before = mockApi.get.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await screen.findByRole("button", { name: "Đang tải lại…" });
    expect(mockApi.get.mock.calls.length - before).toBe(2);
  });

  it("bảng lỗi lần đầu (chưa có data): hộp lỗi đầy đủ như trước", async () => {
    boardFails = true;
    renderWithProviders(<LeaderboardPage />);
    expect((await screen.findByRole("alert")).textContent).toContain("Không thể tải dữ liệu");
  });
});
