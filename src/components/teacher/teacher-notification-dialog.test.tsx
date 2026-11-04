/**
 * Q3-02: hộp thoại "Gửi thông báo" từng chỉ gọi window.alert("Đã tạo thông báo thành công") mà không gửi gì
 * (backend chỉ có POST /notifications/send cho quản trị viên). Khoá: không còn alert, không giả vờ gửi,
 * nút gửi bị vô hiệu kèm lý do.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TeacherNotificationDialog from "./teacher-notification-dialog";

const recipients = [
  { id: "s1", name: "Hoc Vien Mot" },
  { id: "s2", name: "Hoc Vien Hai" },
];

afterEach(() => vi.restoreAllMocks());

describe("TeacherNotificationDialog", () => {
  it("nói rõ chưa gửi được, nút gửi bị vô hiệu và không gọi window.alert", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    render(<TeacherNotificationDialog open onOpenChange={vi.fn()} recipients={recipients} />);

    expect(screen.getByText("Tính năng chưa khả dụng")).toBeTruthy();
    expect(screen.getByText(/2 học viên/)).toBeTruthy();

    const send = screen.getByRole("button", { name: "Gửi thông báo" }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    expect(send.title).toMatch(/chưa cho phép giáo viên gửi thông báo/);
    fireEvent.click(send);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("không còn tuỳ chọn SMS/Email/mức độ/lên lịch giả", () => {
    render(<TeacherNotificationDialog open onOpenChange={vi.fn()} recipients={recipients} />);
    expect(screen.queryByText("SMS")).toBeNull();
    expect(screen.queryByText("Email")).toBeNull();
    expect(screen.queryByText("Mức độ")).toBeNull();
    expect(screen.queryByText("Lên lịch")).toBeNull();
  });

  it("nút Đóng gọi onOpenChange(false)", () => {
    const onOpenChange = vi.fn();
    render(<TeacherNotificationDialog open onOpenChange={onOpenChange} recipients={recipients} />);
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
