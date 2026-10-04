/**
 * Bảng xếp hạng: người đặt `leaderboard_display = anonymous` không có user_id/user_name/avatar_url trong phản hồi
 * (backend bỏ hẳn các field đó). Trang phải hiển thị nhãn "Học viên ẩn danh", không lỗi khi thiếu id, không trùng
 * khoá React giữa nhiều người ẩn danh, và vẫn tô sáng dòng của chính mình.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import LeaderboardPage from "./page";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const ME = "11111111-1111-4111-8111-111111111111";

function mockLeaderboard(classes: { id: string; name: string }[] = []) {
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/leaderboard/classes") return Promise.resolve(envelope(classes));
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

  // A-16: backend không trả cấp độ trong bảng xếp hạng; trước đây mọi dòng đều hiện "Cấp 0".
  it("không hiện 'Cấp 0' cho mọi dòng khi backend không có cấp độ", async () => {
    mockLeaderboard();
    renderWithProviders(<LeaderboardPage />);
    expect(await screen.findByText("Bình Công Khai")).toBeTruthy();
    expect(screen.queryByText(/Cấp\s*0/)).toBeNull();
  });
});
// W2-B: bảng xếp hạng theo lớp (?class_id=) cho học viên/giảng viên của lớp đó.
describe("LeaderboardPage — chọn lớp", () => {
  const CLASS_A = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "ReactJS K12" };

  const leaderboardCalls = () =>
    mockApi.get.mock.calls.filter((c: unknown[]) => c[0] === "/leaderboard").map((c: unknown[]) => (c[1] as { params?: Record<string, unknown> })?.params);

  it("không có lớp nào thì không hiện ô chọn phạm vi", async () => {
    mockLeaderboard([]);
    renderWithProviders(<LeaderboardPage />);

    expect(await screen.findByText("Bình Công Khai")).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Phạm vi bảng xếp hạng" })).toBeNull();
  });

  it("chọn lớp thì gọi /leaderboard kèm class_id, dùng dòng is_me của bảng lớp làm vị trí của mình", async () => {
    mockLeaderboard([CLASS_A]);
    renderWithProviders(<LeaderboardPage />);

    fireEvent.click(await screen.findByRole("button", { name: "ReactJS K12" }));

    await waitFor(() => expect(leaderboardCalls().some((p) => p?.class_id === CLASS_A.id)).toBe(true));
    const classCall = leaderboardCalls().find((p) => p?.class_id === CLASS_A.id);
    expect(classCall).toMatchObject({ period_type: "weekly", limit: 100, class_id: CLASS_A.id });
    expect(screen.getByRole("button", { name: "ReactJS K12" }).getAttribute("aria-pressed")).toBe("true");
    // Hạng #3 là dòng is_me trong bảng lớp (mock dùng chung dữ liệu), hiển thị ở khối "Vị trí của bạn".
    expect(await screen.findByText("#3")).toBeTruthy();
  });

  it("quay lại Toàn hệ thống thì bỏ class_id", async () => {
    mockLeaderboard([CLASS_A]);
    renderWithProviders(<LeaderboardPage />);

    fireEvent.click(await screen.findByRole("button", { name: "ReactJS K12" }));
    await waitFor(() => expect(leaderboardCalls().some((p) => p?.class_id === CLASS_A.id)).toBe(true));
    mockApi.get.mockClear();
    mockLeaderboard([CLASS_A]);
    fireEvent.click(screen.getByRole("button", { name: "Toàn hệ thống" }));

    await waitFor(() => expect(leaderboardCalls().length).toBeGreaterThan(0));
    expect(leaderboardCalls().every((p) => p?.class_id === undefined)).toBe(true);
  });
});
