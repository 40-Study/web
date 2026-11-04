/**
 * B-01 (QA hồi quy 03/10): nhập Session ID hợp lệ làm trang Thống kê crash vì web đọc trường backend
 * không có (`join_timeline.map`). Test dùng ĐÚNG hình dạng phản hồi của dto.AnalyticsResponseDTO và
 * dto.ParticipantAnalyticsDTO; đọc lại trường cũ thì test ĐỎ.
 *
 * Q3-24: giảng viên chọn buổi học từ danh sách của mình thay vì gõ tay Session ID.
 */

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import TeacherAnalyticsPage from "./page";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const SESSION = "83868f4c-be86-42e9-90db-9e4b57d4fefe";
const OLDER_SESSION = "11111111-aaaa-bbbb-cccc-222222222222";

const LIVE_SESSIONS = [
  { id: OLDER_SESSION, title: "Buổi cũ", status: "ended", scheduled_at: "2026-09-01T12:00:00+07:00", created_at: "2026-08-30T00:00:00Z" },
  { id: SESSION, title: "Giải thuật cơ bản", status: "ended", scheduled_at: "2026-10-01T19:00:00+07:00", created_at: "2026-09-30T00:00:00Z" },
  { id: "33333333", title: "Chưa diễn ra", status: "scheduled", scheduled_at: "2026-12-01T19:00:00+07:00", created_at: "2026-11-01T00:00:00Z" },
];

beforeEach(() => {
  resetMockApi();
  useAuthStore.setState({ user: { id: "teacher-1" } as never });
});
afterEach(() => {
  vi.restoreAllMocks();
  useAuthStore.setState({ user: null });
});

function mockBackend(analytics: unknown, participants: unknown) {
  mockApi.get.mockImplementation((url: string) => {
    if (url === "/livestream") return Promise.resolve({ data: { data: LIVE_SESSIONS, total: 3, page: 1, page_size: 100 } });
    return Promise.resolve(url.startsWith("/analytics/livestream/") ? envelope(analytics) : envelope(participants));
  });
}

async function pick(title: RegExp | string) {
  fireEvent.click(await screen.findByRole("button", { name: /Chọn buổi học/ }));
  const option = (await screen.findAllByText(title)).find((el) => el.closest("[class*='cursor-pointer']"));
  fireEvent.click(option!);
}

describe("TeacherAnalyticsPage", () => {
  it("chọn buổi từ danh sách (không còn ô gõ Session ID) và hiện số liệu theo tên trường của backend", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    mockBackend(
      { session_id: SESSION, peak_viewers: 7, total_viewers: 12, total_messages: 5, avg_watch_time_secs: 125 },
      { session_id: SESSION, active_count: 2, total_joined: 9, by_role: { teacher: 1, student: 8 } },
    );
    renderWithProviders(<TeacherAnalyticsPage />);
    expect(screen.queryByPlaceholderText("Nhập Session ID...")).toBeNull();

    await pick(/Giải thuật cơ bản/);

    expect(await screen.findByText("Tổng lượt xem")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByText("2m 5s")).toBeTruthy();
    expect(screen.getByText("Học viên")).toBeTruthy();
    expect(screen.getByText("8")).toBeTruthy();
    expect(mockApi.get.mock.calls.some((c) => String(c[0]) === `/analytics/livestream/${SESSION}`)).toBe(true);
    expect(errors.mock.calls.some((c) => String(c[0]).includes("Cannot read properties"))).toBe(false);
  });

  it("danh sách chỉ có buổi đã/đang diễn ra của mình, lọc theo host_id; buổi sắp diễn ra không có để chọn", async () => {
    mockBackend({ session_id: SESSION }, { session_id: SESSION });
    renderWithProviders(<TeacherAnalyticsPage />);
    await screen.findByRole("button", { name: /Chọn buổi học/ });

    expect(await screen.findAllByText(/Giải thuật cơ bản/)).not.toHaveLength(0);
    expect(screen.queryByText(/Chưa diễn ra/)).toBeNull();
    const listCall = mockApi.get.mock.calls.find((c) => c[0] === "/livestream");
    expect(listCall?.[1]).toMatchObject({ params: { host_id: "teacher-1" } });
  });

  it("buổi chưa có số liệu (backend trả toàn số 0 / thiếu trường) vẫn hiển thị, không crash", async () => {
    mockBackend({ session_id: SESSION }, { session_id: SESSION, active_count: 0, total_joined: 0 });
    renderWithProviders(<TeacherAnalyticsPage />);
    await pick(/Giải thuật cơ bản/);

    expect(await screen.findByText("Tổng lượt xem")).toBeTruthy();
    expect(screen.getByText("Chưa có ai tham gia buổi học này.")).toBeTruthy();
  });

  it("backend từ chối số liệu của buổi (403/404) hiện thông báo thay vì trang trống", async () => {
    mockApi.get.mockImplementation((url: string) =>
      url === "/livestream"
        ? Promise.resolve({ data: { data: LIVE_SESSIONS, total: 3, page: 1, page_size: 100 } })
        : Promise.reject(Object.assign(new Error("Request failed"), { response: { status: 404 } })),
    );
    renderWithProviders(<TeacherAnalyticsPage />);
    await pick(/Giải thuật cơ bản/);

    expect(await screen.findByText(/Không thể tải thống kê|Không tìm thấy dữ liệu/)).toBeTruthy();
  });

  it("chưa có buổi học nào: nói rõ thay vì bắt nhập ID", async () => {
    mockApi.get.mockResolvedValue({ data: { data: [], total: 0, page: 1, page_size: 100 } });
    renderWithProviders(<TeacherAnalyticsPage />);
    expect(await screen.findByText("Chưa có buổi học nào để xem thống kê")).toBeTruthy();
  });
});
