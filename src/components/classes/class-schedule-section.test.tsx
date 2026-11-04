/**
 * Q3-04: lớp có API lịch học/buổi học nhưng giáo viên không có giao diện nào để tạo. Test ĐỎ nếu tab bị bỏ,
 * nếu form gửi sai tên field/số thứ (0 = Chủ nhật), nếu cho gửi giờ kết thúc <= giờ bắt đầu, hoặc nếu 409 trùng
 * giờ không được nói rõ bằng tiếng Việt.
 */

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
const { toastSuccess, toastError } = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: toastError } }));

import { ClassScheduleSection } from "./class-schedule-section";
import { ApiError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const CLASS_ID = "c1";

function serve({ schedules = [] as unknown[], sessions = [] as unknown[] } = {}) {
  mockApi.get.mockImplementation((url: string) => {
    if (url === `/classes/${CLASS_ID}/schedules`) return Promise.resolve(envelope(schedules));
    if (url === `/classes/${CLASS_ID}/sessions`)
      return Promise.resolve(envelope({ data: sessions, total: sessions.length, page: 1, page_size: 20 }));
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
  mockApi.post.mockResolvedValue(envelope([]));
  mockApi.put.mockResolvedValue(envelope({}));
  mockApi.delete.mockResolvedValue(envelope(null));
}

const SCHEDULE = {
  id: "sch1",
  class_id: CLASS_ID,
  day_of_week: 1,
  start_time: "18:00",
  end_time: "20:00",
  room: "Phòng 301",
  is_active: true,
  effective_from: "2026-11-02T00:00:00Z",
};

beforeEach(() => {
  resetMockApi();
  toastSuccess.mockClear();
  toastError.mockClear();
});

describe("ClassScheduleSection", () => {
  it("liệt kê lịch hằng tuần (nhãn thứ tiếng Việt, giờ, phòng) và các buổi học đã có", async () => {
    serve({
      schedules: [SCHEDULE],
      sessions: [{ id: "s1", class_id: CLASS_ID, date: "2026-11-02", start_time: "18:00", end_time: "20:00", status: "scheduled", topic: "Giới thiệu" }],
    });
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite />);

    expect(await screen.findByText(/Thứ hai · 18:00–20:00 · Phòng 301/)).toBeTruthy();
    expect(screen.getByText(/Áp dụng từ/)).toBeTruthy();
    expect(await screen.findByText("Giới thiệu")).toBeTruthy();
    expect(screen.getByText("Đã lên lịch")).toBeTruthy();
  });

  it("không có quyền ghi (hoặc lớp lưu trữ): chỉ xem, không có nút thêm/sinh/sửa/xoá", async () => {
    serve({ schedules: [SCHEDULE] });
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite={false} />);

    await screen.findByText(/Thứ hai/);
    expect(screen.queryByRole("button", { name: /Thêm lịch học/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Sinh buổi học/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Sửa lịch/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Xoá lịch/ })).toBeNull();
  });

  it("chưa có lịch: trạng thái rỗng và nút 'Sinh buổi học' bị khoá", async () => {
    serve();
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite />);

    expect(await screen.findByText("Chưa có lịch học hằng tuần")).toBeTruthy();
    expect((screen.getByRole("button", { name: /Sinh buổi học/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("form lịch: giờ kết thúc không sau giờ bắt đầu thì báo lỗi và KHÔNG gọi API", async () => {
    serve();
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite />);
    await userEvent.click(await screen.findByRole("button", { name: /Thêm lịch học/ }));

    await userEvent.selectOptions(screen.getByLabelText("Thứ trong tuần"), "1");
    await userEvent.type(screen.getByLabelText("Giờ bắt đầu"), "18:00");
    await userEvent.type(screen.getByLabelText("Giờ kết thúc"), "17:00");
    await userEvent.type(screen.getByLabelText("Áp dụng từ ngày"), "2026-11-02");
    await userEvent.click(screen.getByRole("button", { name: "Thêm lịch" }));

    expect(await screen.findByText("Giờ kết thúc phải sau giờ bắt đầu")).toBeTruthy();
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it("tạo lịch Chủ nhật: gửi day_of_week=0 và đúng tên field backend", async () => {
    serve();
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite />);
    await userEvent.click(await screen.findByRole("button", { name: /Thêm lịch học/ }));

    await userEvent.selectOptions(screen.getByLabelText("Thứ trong tuần"), "0");
    await userEvent.type(screen.getByLabelText("Giờ bắt đầu"), "08:30");
    await userEvent.type(screen.getByLabelText("Giờ kết thúc"), "10:00");
    await userEvent.type(screen.getByLabelText("Phòng học (không bắt buộc)"), "P2");
    await userEvent.type(screen.getByLabelText("Áp dụng từ ngày"), "2026-11-02");
    await userEvent.click(screen.getByRole("button", { name: "Thêm lịch" }));

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith(`/classes/${CLASS_ID}/schedules`, {
        day_of_week: 0,
        start_time: "08:30",
        end_time: "10:00",
        room: "P2",
        effective_from: "2026-11-02",
        effective_until: undefined,
      })
    );
  });

  it("sinh buổi học: gửi start_date/end_date tới /sessions/generate", async () => {
    serve({ schedules: [SCHEDULE] });
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite />);
    await screen.findByText(/Thứ hai/);
    await userEvent.click(screen.getByRole("button", { name: /Sinh buổi học/ }));

    await userEvent.type(screen.getByLabelText("Từ ngày"), "2026-11-02");
    await userEvent.type(screen.getByLabelText("Đến ngày"), "2026-12-02");
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Sinh buổi học" }));

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith(`/classes/${CLASS_ID}/sessions/generate`, {
        start_date: "2026-11-02",
        end_date: "2026-12-02",
      })
    );
  });

  it("tạo buổi lẻ bị 409 trùng giờ: toast tiếng Việt nêu rõ trùng lịch, form vẫn mở để sửa", async () => {
    serve();
    mockApi.post.mockRejectedValue(new ApiError(409, "UNKNOWN", "buổi học trùng giờ với một buổi khác của lớp này hoặc của giảng viên lớp"));
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite />);
    await userEvent.click(await screen.findByRole("button", { name: /Thêm buổi học lẻ/ }));

    await userEvent.type(screen.getByLabelText("Ngày học"), "2026-11-05");
    await userEvent.type(screen.getByLabelText("Giờ bắt đầu"), "18:00");
    await userEvent.type(screen.getByLabelText("Giờ kết thúc"), "19:00");
    await userEvent.click(screen.getByRole("button", { name: "Thêm buổi học" }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    const [title, options] = toastError.mock.calls[0];
    expect(title).toBe("Không thể tạo buổi học");
    expect(options.description).toMatch(/^Trùng lịch:.*trùng giờ/);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("xoá lịch có hộp xác nhận rồi gọi DELETE", async () => {
    serve({ schedules: [SCHEDULE] });
    renderWithProviders(<ClassScheduleSection classId={CLASS_ID} canWrite />);
    await userEvent.click(await screen.findByRole("button", { name: "Xoá lịch Thứ hai" }));
    expect(mockApi.delete).not.toHaveBeenCalled();

    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xoá lịch" }));
    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith(`/classes/${CLASS_ID}/schedules/sch1`));
  });
});
