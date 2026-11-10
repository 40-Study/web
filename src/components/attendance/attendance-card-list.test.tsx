/**
 * Q3-21: bảng điểm danh 720px cắt nút trạng thái ở 390px. Bố cục thẻ phải có đủ 4 nút trạng thái, ô ghi chú và
 * đổi trạng thái đúng học viên (cùng hợp đồng props với AttendanceTable).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AttendanceCardList } from "./attendance-card-list";

const rows = [
  { studentId: "u1", name: "Bé Minh", status: "present" as const },
  { studentId: "u2", name: "Bé Hoa", note: "xin nghỉ", checkInTime: "invalid", lateMinutes: 5 },
];

describe("AttendanceCardList", () => {
  it("mỗi học viên một thẻ với đủ 4 trạng thái; nút đang chọn có aria-pressed", () => {
    render(<AttendanceCardList rows={rows} onStatusChange={vi.fn()} onNoteChange={vi.fn()} />);

    const minh = screen.getByRole("group", { name: "Trạng thái của Bé Minh" });
    expect(Array.from(minh.querySelectorAll("button")).map((b) => b.textContent)).toEqual(["Có mặt", "Đi trễ", "Vắng", "Có phép"]);
    expect(minh.querySelector('button[aria-pressed="true"]')?.textContent).toBe("Có mặt");
  });

  it("bấm trạng thái và nhập ghi chú gọi callback với đúng studentId", () => {
    const onStatusChange = vi.fn();
    const onNoteChange = vi.fn();
    render(<AttendanceCardList rows={rows} onStatusChange={onStatusChange} onNoteChange={onNoteChange} />);

    const hoa = screen.getByRole("group", { name: "Trạng thái của Bé Hoa" });
    fireEvent.click(Array.from(hoa.querySelectorAll("button")).find((b) => b.textContent === "Vắng")!);
    expect(onStatusChange).toHaveBeenCalledWith("u2", "absent");

    fireEvent.change(screen.getByLabelText("Ghi chú cho Bé Minh"), { target: { value: "đến muộn" } });
    expect(onNoteChange).toHaveBeenCalledWith("u1", "đến muộn");
  });

  it("disabled khoá mọi nút; không có học viên thì hiện thông báo rỗng", () => {
    const { rerender } = render(<AttendanceCardList rows={rows} onStatusChange={vi.fn()} onNoteChange={vi.fn()} disabled />);
    expect(screen.getAllByRole("button").every((b) => (b as HTMLButtonElement).disabled)).toBe(true);

    rerender(<AttendanceCardList rows={[]} onStatusChange={vi.fn()} onNoteChange={vi.fn()} />);
    expect(screen.getByText("Lớp này chưa có học viên nào.")).toBeTruthy();
  });
});
