/**
 * Thanh bên Thảo luận ("Thành viên tích cực"): người đặt `leaderboard_display = anonymous` không có
 * user_id/user_name/avatar_url trong phản hồi. Thanh bên phải hiện "Học viên ẩn danh" (chữ cái đầu "HỌ" thay vì
 * "undefined"), không lỗi khi thiếu id, không trùng khoá React giữa nhiều người ẩn danh, và không rò tên khác.
 */

import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { DiscussionSidebar } from "./discussion-sidebar";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

function mockMembers() {
  mockApi.get.mockResolvedValue(
    envelope({
      period_type: "all_time",
      period: "all",
      total: 3,
      entries: [
        // hai người ẩn danh liền nhau, đồng hạng: không user_id nên khoá dòng phải dựa vào vị trí
        { rank: 1, display_name: "Học viên ẩn danh", points: 90 },
        { rank: 1, display_name: "Học viên ẩn danh", points: 90 },
        { rank: 3, user_id: "22222222-2222-4222-8222-222222222222", user_name: "binh", full_name: "Bình Công Khai", display_name: "Bình Công Khai", points: 50, avatar_url: "https://cdn.test/binh.png" },
      ],
    }),
  );
}

beforeEach(() => resetMockApi());
afterEach(() => vi.restoreAllMocks());

describe("DiscussionSidebar — thành viên tích cực", () => {
  it("hiện nhãn ẩn danh cho dòng không có danh tính, giữ tên người công khai, không lỗi khoá trùng", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    mockMembers();
    renderWithProviders(<DiscussionSidebar posts={[]} onCategoryChange={() => {}} />);

    expect(await screen.findByText("Bình Công Khai")).toBeTruthy();
    expect(screen.getAllByText("Học viên ẩn danh")).toHaveLength(2);
    // chữ cái đầu của người ẩn danh lấy từ nhãn (2 ký tự đầu), không phải "UN" của undefined
    expect(screen.getAllByText("HỌ")).toHaveLength(2);
    expect(screen.queryByText("UN")).toBeNull();
    expect(screen.getByAltText("Bình Công Khai")).toBeTruthy();
    // điểm vẫn hiện cho cả người ẩn danh
    expect(screen.getAllByText("90 điểm")).toHaveLength(2);
    // React cảnh báo khoá trùng bằng console.error: không được có
    const duplicateKey = errors.mock.calls.some((c) => String(c[0]).includes("same key"));
    expect(duplicateKey).toBe(false);
  });
});