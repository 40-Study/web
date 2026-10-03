/**
 * B-01 (QA hồi quy 03/10): nhập Session ID hợp lệ làm trang Thống kê crash vì web đọc trường backend
 * không có (`join_timeline.map`). Test dùng ĐÚNG hình dạng phản hồi của dto.AnalyticsResponseDTO và
 * dto.ParticipantAnalyticsDTO; đọc lại trường cũ thì test ĐỎ.
 */

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import TeacherAnalyticsPage from "./page";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const SESSION = "83868f4c-be86-42e9-90db-9e4b57d4fefe";

beforeEach(() => resetMockApi());
afterEach(() => vi.restoreAllMocks());

function search() {
  fireEvent.change(screen.getByPlaceholderText("Nhập Session ID..."), { target: { value: SESSION } });
  fireEvent.click(screen.getByRole("button", { name: "Xem thống kê" }));
}

describe("TeacherAnalyticsPage", () => {
  it("hiện số liệu buổi học theo tên trường của backend, không crash", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    mockApi.get.mockImplementation((url: string) =>
      Promise.resolve(
        url.startsWith("/analytics/livestream/")
          ? envelope({ session_id: SESSION, peak_viewers: 7, total_viewers: 12, total_messages: 5, avg_watch_time_secs: 125 })
          : envelope({ session_id: SESSION, active_count: 2, total_joined: 9, by_role: { teacher: 1, student: 8 } }),
      ),
    );
    renderWithProviders(<TeacherAnalyticsPage />);
    search();

    expect(await screen.findByText("Tổng lượt xem")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByText("2m 5s")).toBeTruthy();
    expect(screen.getByText("Học viên")).toBeTruthy();
    expect(screen.getByText("8")).toBeTruthy();
    expect(errors.mock.calls.some((c) => String(c[0]).includes("Cannot read properties"))).toBe(false);
  });

  it("buổi chưa có số liệu (backend trả toàn số 0 / thiếu trường) vẫn hiển thị, không crash", async () => {
    mockApi.get.mockImplementation((url: string) =>
      Promise.resolve(
        url.startsWith("/analytics/livestream/")
          ? envelope({ session_id: SESSION })
          : envelope({ session_id: SESSION, active_count: 0, total_joined: 0 }),
      ),
    );
    renderWithProviders(<TeacherAnalyticsPage />);
    search();

    expect(await screen.findByText("Tổng lượt xem")).toBeTruthy();
    expect(screen.getByText("Chưa có ai tham gia buổi học này.")).toBeTruthy();
  });

  it("Session ID không thuộc về mình (backend 403/404) hiện thông báo thay vì trang trống", async () => {
    mockApi.get.mockRejectedValue(Object.assign(new Error("Request failed"), { response: { status: 404 } }));
    renderWithProviders(<TeacherAnalyticsPage />);
    search();

    expect(await screen.findByText(/Không thể tải thống kê|Không tìm thấy dữ liệu/)).toBeTruthy();
  });
});
