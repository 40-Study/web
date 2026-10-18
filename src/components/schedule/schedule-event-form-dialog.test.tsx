/**
 * B-09: form "Tạo/Sửa buổi học" phải gửi giờ kết thúc và phòng học, đổi được giờ khi sửa buổi chưa bắt đầu,
 * và chặn giờ sai ngay trên form (backend cũng trả 400, nhưng người dùng cần thấy lý do tại chỗ).
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/queries/use-courses", () => ({ useMyCourses: () => ({ data: [], isLoading: false }) }));
vi.mock("@/hooks/queries/use-classes", () => ({ useClasses: () => ({ data: [], isLoading: false }) }));

import ScheduleEventFormDialog, { validateEventTimes } from "./schedule-event-form-dialog";
import type { ScheduleEvent } from "./week-calendar-grid";

const FUTURE_DAY = "2099-10-05";

function event(over: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    id: "ls1",
    title: "Buổi cũ",
    startTime: new Date(`${FUTURE_DAY}T14:00:00`).toISOString(),
    endTime: new Date(`${FUTURE_DAY}T15:00:00`).toISOString(),
    type: "livestream",
    status: "upcoming",
    kind: "livestream",
    ...over,
  };
}

function setup(ev: ScheduleEvent) {
  const onSave = vi.fn();
  render(<ScheduleEventFormDialog open onOpenChange={() => {}} event={ev} onSave={onSave} />);
  return onSave;
}

describe("validateEventTimes", () => {
  const now = new Date("2026-10-04T10:00:00");
  it("kết thúc không sau bắt đầu là lỗi", () => {
    expect(validateEventTimes(new Date("2026-10-05T10:00:00"), new Date("2026-10-05T10:00:00"), false, now)).toMatch(/sau giờ bắt đầu/);
    expect(validateEventTimes(new Date("2026-10-05T11:00:00"), new Date("2026-10-05T10:00:00"), false, now)).toMatch(/sau giờ bắt đầu/);
  });
  it("quá khứ chỉ bị chặn khi checkPast, có dung sai 1 phút", () => {
    const past = new Date("2026-10-04T09:00:00");
    const end = new Date("2026-10-04T10:30:00");
    expect(validateEventTimes(past, end, true, now)).toMatch(/quá khứ/);
    expect(validateEventTimes(past, end, false, now)).toBeNull();
    expect(validateEventTimes(new Date("2026-10-04T09:59:30"), end, true, now)).toBeNull();
  });
  it("hợp lệ thì null; ngày rác báo lỗi", () => {
    expect(validateEventTimes(new Date("2026-10-05T10:00:00"), new Date("2026-10-05T11:30:00"), true, now)).toBeNull();
    expect(validateEventTimes(new Date("x"), new Date("2026-10-05T11:30:00"), true, now)).toMatch(/không hợp lệ/);
  });
});

describe("ScheduleEventFormDialog — sửa buổi", () => {
  it("đổi giờ kết thúc và phòng rồi lưu: onSave nhận đúng giờ kết thúc và phòng", () => {
    const onSave = setup(event({ location: "Phòng cũ" }));

    fireEvent.change(screen.getByLabelText(/Kết thúc/), { target: { value: "16:30" } });
    fireEvent.change(screen.getByLabelText(/Phòng học/), { target: { value: "Phòng A101" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const [data, id] = onSave.mock.calls[0];
    expect(id).toBe("ls1");
    expect(data.location).toBe("Phòng A101");
    expect(new Date(data.endTime).getTime() - new Date(data.startTime).getTime()).toBe(150 * 60_000);
  });

  it("giờ kết thúc không sau giờ bắt đầu: hiện lỗi và KHÔNG lưu", () => {
    const onSave = setup(event());
    fireEvent.change(screen.getByLabelText(/Kết thúc/), { target: { value: "13:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/sau giờ bắt đầu/);
  });

  it("đổi giờ bắt đầu sang quá khứ: hiện lỗi; không đổi giờ thì sửa tiêu đề vẫn lưu được", () => {
    const onSave = setup(event());
    fireEvent.change(screen.getByLabelText(/Ngày/), { target: { value: "2020-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/quá khứ/);
  });

  it("buổi đã bắt đầu hoặc kết thúc: khoá ô giờ, vẫn sửa được phòng", () => {
    setup(event({ status: "ongoing" }));
    expect((screen.getByLabelText(/Bắt đầu/) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText(/Kết thúc/) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText(/Phòng học/) as HTMLInputElement).disabled).toBe(false);
  });

  it("buổi chưa bắt đầu: ô giờ mở khoá (trước đây luôn khoá)", () => {
    setup(event());
    expect((screen.getByLabelText(/Ngày/) as HTMLInputElement).disabled).toBe(false);
    expect((screen.getByLabelText(/Bắt đầu/) as HTMLInputElement).disabled).toBe(false);
  });
});

describe("ScheduleEventFormDialog — lưu bất đồng bộ", () => {
  it("chặn double submit, giữ bản nháp và mở lại nút khi API lỗi", async () => {
    let reject: (error: Error) => void = () => {};
    const onSave = vi.fn(() => new Promise<void>((_, fail) => { reject = fail; }));
    const onOpenChange = vi.fn();
    render(<ScheduleEventFormDialog open onOpenChange={onOpenChange} event={event()} onSave={onSave} />);
    const save = screen.getByRole("button", { name: "Lưu thay đổi" });
    fireEvent.click(save); fireEvent.click(save);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => reject(new Error("Máy chủ tạm ngừng")));
    expect(screen.getByRole("alert").textContent).toContain("Máy chủ tạm ngừng");
    expect((screen.getByLabelText(/Tiêu đề/) as HTMLInputElement).value).toBe("Buổi cũ");
    expect((save as HTMLButtonElement).disabled).toBe(false);
  });
  it("chỉ đóng form sau khi lưu thành công", async () => {
    const onOpenChange = vi.fn();
    render(<ScheduleEventFormDialog open onOpenChange={onOpenChange} event={event()} onSave={async () => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
  it("hủy buổi cần xác nhận, cancel form không mutation", async () => {
    const onDelete = vi.fn(async () => {});
    const onSave = vi.fn();
    const onOpenChange = vi.fn();
    render(<ScheduleEventFormDialog open onOpenChange={onOpenChange} event={event()} onSave={onSave} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "Huỷ buổi học" }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(onDelete).not.toHaveBeenCalled(); expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận huỷ buổi" }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
  });
});
