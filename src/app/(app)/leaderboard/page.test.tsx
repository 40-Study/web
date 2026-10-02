/**
 * Bảng xếp hạng: người đặt `leaderboard_display = anonymous` không có user_id/user_name/avatar_url trong phản hồi
 * (backend bỏ hẳn các field đó). Trang phải hiển thị nhãn "Học viên ẩn danh", không lỗi khi thiếu id, không trùng
 * khoá React giữa nhiều người ẩn danh, và vẫn tô sáng dòng của chính mình.
 */

import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import LeaderboardPage from "./page";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const ME = "11111111-1111-4111-8111-111111111111";

function mockLeaderboard() {
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/leaderboard/me") {
      return Promise.resolve(
        envelope({
          period_type: "weekly",
          period: "2026-W41",
          entry: { rank: 3, user_id: ME, user_name: "toi", full_name: "Tôi Là Ẩn Danh", display_name: "Tôi Là Ẩn Danh", points: 70, is_me: true },
        }),
      );
    }
    return Promise.resolve(
      envelope({
        period_type: "weekly",
        period: "2026-W41",
        total: 4,
        entries: [
          // hai người ẩn danh liền nhau, đồng hạng: không user_id nên khoá dòng phải dựa vào vị trí
          { rank: 1, display_name: "Học viên ẩn danh", points: 90 },
          { rank: 1, display_name: "Học viên ẩn danh", points: 90 },
          { rank: 3, user_id: ME, user_name: "toi", full_name: "Tôi Là Ẩn Danh", display_name: "Tôi Là Ẩn Danh", points: 70, is_me: true },
          { rank: 4, user_id: "22222222-2222-4222-8222-222222222222", user_name: "binh", full_name: "Bình Công Khai", display_name: "Bình Công Khai", points: 50 },
        ],
      }),
    );
  });
}

beforeEach(() => resetMockApi());
afterEach(() => vi.restoreAllMocks());

describe("LeaderboardPage — người ẩn danh", () => {
  it("hiện nhãn ẩn danh cho dòng không có danh tính, không lộ gì khác, không lỗi khoá trùng", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    mockLeaderboard();
    renderWithProviders(<LeaderboardPage />);

    expect(await screen.findByText("Bình Công Khai")).toBeTruthy();
    expect(screen.getAllByText("Học viên ẩn danh")).toHaveLength(2);
    // dòng của chính mình hiện tên thật kèm (Bạn), vì backend không ẩn danh với chính chủ
    expect(screen.getByText(/Tôi Là Ẩn Danh/).textContent).toContain("(Bạn)");
    // React cảnh báo khoá trùng bằng console.error: không được có
    const duplicateKey = errors.mock.calls.some((c) => String(c[0]).includes("same key"));
    expect(duplicateKey).toBe(false);
  });
});