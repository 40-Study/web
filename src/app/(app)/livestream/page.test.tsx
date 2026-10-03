/**
 * A-08: trang danh sách buổi livestream của học viên. Giờ hiển thị theo giờ Việt Nam (không lệch 7 giờ),
 * chỉ buổi đang live mới có nút "Vào lớp", trạng thái bằng tiếng Việt.
 */

import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import StudentLivestreamPage from "./page";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const base = {
  description: "",
  host_id: "h",
  class_id: "c",
  room_name: "r",
  max_viewers: 100,
  is_recorded: false,
  settings: "{}",
  created_at: "2026-10-01T00:00:00+07:00",
};

function mockSessions(data: unknown[]) {
  mockApi.get.mockResolvedValue({ data: { data, total: data.length, page: 1, page_size: 50 } });
}

beforeEach(() => resetMockApi());
afterEach(() => vi.restoreAllMocks());

describe("StudentLivestreamPage", () => {
  it("chia nhóm, giờ VN đúng, chỉ buổi đang live có nút Vào lớp", async () => {
    mockSessions([
      { ...base, id: "soon", title: "Live hỏi đáp Next.js", status: "scheduled", scheduled_at: "2026-10-05T20:30:00+07:00", scheduled_end_at: "2026-10-05T22:00:00+07:00", location: "Phòng A101" },
      { ...base, id: "now", title: "Buổi đang diễn ra", status: "live", scheduled_at: "2026-10-03T19:00:00+07:00" },
      { ...base, id: "old", title: "Buổi đã xong", status: "ended", scheduled_at: "2026-09-20T19:00:00+07:00" },
    ]);
    renderWithProviders(<StudentLivestreamPage />);

    expect(await screen.findByText("Live hỏi đáp Next.js")).toBeTruthy();
    expect(screen.getByText(/20:30 – 22:00/)).toBeTruthy();
    expect(screen.getByText("Phòng A101")).toBeTruthy();
    expect(screen.getByText("Đang trực tiếp")).toBeTruthy();
    expect(screen.getByText("Sắp diễn ra")).toBeTruthy();
    expect(screen.getByText("Đã kết thúc")).toBeTruthy();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("/rooms/now");
    expect(screen.getByText("Chưa bắt đầu")).toBeTruthy();
  });

  it("chưa có buổi nào: hiện trạng thái trống", async () => {
    mockSessions([]);
    renderWithProviders(<StudentLivestreamPage />);
    expect(await screen.findByText(/Chưa có buổi học trực tiếp nào/)).toBeTruthy();
  });

  it("API lỗi: báo lỗi thay vì trang trống", async () => {
    mockApi.get.mockRejectedValue(new Error("boom"));
    renderWithProviders(<StudentLivestreamPage />);
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});
