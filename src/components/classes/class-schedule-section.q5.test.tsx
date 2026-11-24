/**
 * Q5-T02: buổi học đã sinh không có cách huỷ trong giao diện (backend có CancelSession). Q5-T14: lịch hằng tuần trùng
 * giờ với lớp khác của giảng viên được lưu im lặng. Test ĐỎ nếu nút "Huỷ buổi" bị bỏ / gọi DELETE khi chưa xác nhận /
 * hiện cho buổi không còn "Đã lên lịch" hoặc người chỉ xem, và nếu `warnings[]` của backend không ra toast cảnh báo.
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

const CLASS_ID = "c1";
const session = (id: string, date: string, status: string) => ({
  id, class_id: CLASS_ID, date, start_time: "18:00", end_time: "20:00", status,
});

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
  it("chỉ buổi 'Đã lên lịch' có nút Huỷ buổi; huỷ phải qua hộp xác nhận rồi mới gọi DELETE", async () => {
    serve([session("s1", "2026-11-02", "scheduled"), session("s2", "2026-11-09", "completed"), session("s3", "2026-11-16", "cancelled")]);
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

  it("'Giữ lại' đóng hộp thoại và KHÔNG gọi DELETE", async () => {
    serve([session("s1", "2026-11-02", "scheduled")]);
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite />);

    await userEvent.click(await screen.findByRole("button", { name: /Huỷ buổi/ }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Giữ lại" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mockApi.delete).not.toHaveBeenCalled();
  });

  it("không có quyền ghi: không có nút Huỷ buổi", async () => {
    serve([session("s1", "2026-11-02", "scheduled")]);
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
