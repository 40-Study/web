/**
 * Q5-T02: buổi học đã sinh không có cách huỷ trong giao diện (backend có CancelSession). Q5-T14: lịch hằng tuần trùng
 * giờ với lớp khác của giảng viên được lưu im lặng. Test ĐỎ nếu nút "Huỷ buổi" bị bỏ / gọi DELETE khi chưa xác nhận /
 * hiện cho buổi không còn "Đã lên lịch", buổi đã bắt đầu hoặc người chỉ xem, và nếu `warnings[]` của backend không ra toast cảnh báo.
 */

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
const { toastSuccess, toastError, toastWarning } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: toastError, warning: toastWarning } }));

import { ClassScheduleSection } from "./class-schedule-section";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import { createAppQueryClient } from "@/lib/query-client";

const CLASS_ID = "c1";
const session = (id: string, date: string, status: string, start = "18:00", end = "20:00") => ({
  id, class_id: CLASS_ID, date, start_time: start, end_time: end, status,
});

/** Ngày YYYY-MM-DD theo giờ Việt Nam, lệch `days` ngày so với bây giờ (test không phụ thuộc ngày chạy). */
function vnDay(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}
const PAST = vnDay(-7);
const FUTURE = vnDay(7);

function serve(sessions: unknown[]) {
  mockApi.get.mockImplementation((url: string) => {
    if (url === `/classes/${CLASS_ID}/schedules`) return Promise.resolve(envelope([]));
    if (url === `/classes/${CLASS_ID}/sessions`)
      return Promise.resolve(envelope({ data: sessions, total: sessions.length, page: 1, page_size: 20 }));
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
  mockApi.delete.mockResolvedValue(envelope(null));
}

beforeEach(() => {
  resetMockApi();
  toastSuccess.mockClear();
  toastError.mockClear();
  toastWarning.mockClear();
});

describe("Q5-T02: huỷ buổi học đã sinh", () => {
  it("chỉ buổi 'Đã lên lịch' CHƯA bắt đầu có nút Huỷ buổi; huỷ phải qua hộp xác nhận rồi mới gọi DELETE", async () => {
    serve([
      session("s1", FUTURE, "scheduled"),
      session("s2", FUTURE, "completed"),
      session("s3", FUTURE, "cancelled"),
      session("s4", FUTURE, "in_progress"),
    ]);
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite />);

    const cancelButtons = await screen.findAllByRole("button", { name: /Huỷ buổi/ });
    expect(cancelButtons).toHaveLength(1);

    await userEvent.click(cancelButtons[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Huỷ buổi học?")).toBeTruthy();
    expect(mockApi.delete).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole("button", { name: "Huỷ buổi học" }));
    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith(`/classes/${CLASS_ID}/sessions/s1`, { data: undefined }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Đã huỷ buổi học"));
  });

  // M1: backend không bao giờ chuyển buổi sang completed/in_progress lúc chạy nên buổi đã qua vẫn là "scheduled";
  // nút huỷ trước đây hiện cả trên buổi đã diễn ra (có thể đã có điểm danh).
  it("buổi 'Đã lên lịch' đã qua hoặc đã bắt đầu hôm nay KHÔNG có nút Huỷ; chỉ buổi tương lai có", async () => {
    serve([
      session("past", PAST, "scheduled"),
      session("started-today", vnDay(0), "scheduled", "00:00", "00:01"),
      session("future", FUTURE, "scheduled"),
    ]);
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite />);

    await screen.findAllByText("Đã lên lịch");
    const cancelButtons = screen.getAllByRole("button", { name: /Huỷ buổi/ });
    expect(cancelButtons).toHaveLength(1);

    await userEvent.click(cancelButtons[0]);
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Huỷ buổi học" }));
    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith(`/classes/${CLASS_ID}/sessions/future`, { data: undefined }));
  });

  // L1: staleTime 30 giây của app (không phải 0 như client test mặc định) mới lộ việc invalidate có chạy hay không.
  it("huỷ xong danh sách tải lại và buổi đó hiện huy hiệu 'Đã huỷ' (client thật của app, staleTime 30s)", async () => {
    let cancelled = false;
    mockApi.get.mockImplementation((url: string) => {
      if (url === `/classes/${CLASS_ID}/schedules`) return Promise.resolve(envelope([]));
      if (url === `/classes/${CLASS_ID}/sessions`) {
        const rows = [session("s1", FUTURE, cancelled ? "cancelled" : "scheduled")];
        return Promise.resolve(envelope({ data: rows, total: 1, page: 1, page_size: 20 }));
      }
      return Promise.reject(new Error(`unexpected GET ${url}`));
    });
    mockApi.delete.mockImplementation(() => {
      cancelled = true;
      return Promise.resolve(envelope(null));
    });
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite />, { queryClient: createAppQueryClient() });

    await userEvent.click(await screen.findByRole("button", { name: /Huỷ buổi/ }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Huỷ buổi học" }));

    expect(await screen.findByText("Đã huỷ")).toBeTruthy();
    expect(screen.queryByText("Đã lên lịch")).toBeNull();
    expect(screen.queryByRole("button", { name: /Huỷ buổi/ })).toBeNull();
  });

  it("'Giữ lại' đóng hộp thoại và KHÔNG gọi DELETE", async () => {
    serve([session("s1", FUTURE, "scheduled")]);
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite />);

    await userEvent.click(await screen.findByRole("button", { name: /Huỷ buổi/ }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Giữ lại" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mockApi.delete).not.toHaveBeenCalled();
  });

  it("không có quyền ghi: không có nút Huỷ buổi", async () => {
    serve([session("s1", FUTURE, "scheduled")]);
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite={false} />);

    await screen.findByText("Đã lên lịch");
    expect(screen.queryByRole("button", { name: /Huỷ buổi/ })).toBeNull();
  });
});

describe("Q5-T14: cảnh báo trùng giờ khi lưu lịch hằng tuần", () => {
  async function addSchedule(response: unknown) {
    serve([]);
    mockApi.post.mockResolvedValue(envelope(response));
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite />);
    await userEvent.click(await screen.findByRole("button", { name: /Thêm lịch học/ }));
    await userEvent.selectOptions(screen.getByLabelText("Thứ trong tuần"), "1");
    await userEvent.type(screen.getByLabelText("Giờ bắt đầu"), "18:00");
    await userEvent.type(screen.getByLabelText("Giờ kết thúc"), "20:00");
    await userEvent.type(screen.getByLabelText("Áp dụng từ ngày"), "2026-11-02");
    await userEvent.click(screen.getByRole("button", { name: "Thêm lịch" }));
  }

  it("response có warnings: lưu vẫn thành công nhưng báo toast cảnh báo nêu lớp, thứ và giờ trùng", async () => {
    await addSchedule({
      id: "sch1",
      warnings: [{ class_id: "c9", class_name: "Lớp Git buổi tối", weekday: 1, start_time: "18:30:00", end_time: "20:30:00" }],
    });

    await waitFor(() => expect(toastWarning).toHaveBeenCalledTimes(1));
    const [title, options] = toastWarning.mock.calls[0];
    expect(title).toBe("Đã tạo lịch học");
    expect(options.description).toContain('lớp "Lớp Git buổi tối" (Thứ hai 18:30–20:30)');
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it.each([
    ["warnings rỗng", { id: "sch1", warnings: [] }],
    ["backend cũ không có trường warnings", { id: "sch1" }],
  ])("%s: toast thành công trơn, không cảnh báo", async (_name, response) => {
    await addSchedule(response);

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Đã tạo lịch học"));
    expect(toastWarning).not.toHaveBeenCalled();
  });
});
