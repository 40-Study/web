/**
 * F-18 (QA2 261013): ngày giờ điểm danh hiện "19:00 07/10/2026" (giờ trước, ngày sau) — đọc ngược so với
 * cách người Việt viết; phải là "07/10/2026 19:00".
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const attendance: { note?: string; [k: string]: unknown } = {
  id: "a1",
  session_id: "s1",
  student_id: "u1",
  status: "present",
  check_in_time: "2026-10-07T19:00:00+07:00",
  created_at: "2026-10-07T19:05:00+07:00",
};

vi.mock("@/hooks/queries/use-sessions", () => ({
  useMyAttendances: () => ({ data: { attendances: [attendance], total: 1 }, isLoading: false }),
  useAllMyAttendances: () => ({ data: [attendance], isLoading: false }),
}));

import MyAttendancePage from "./page";

describe("MyAttendancePage — định dạng ngày giờ", () => {
  it("hiện ngày trước, giờ sau", () => {
    render(<MyAttendancePage />);
    // Hiện ở cả bảng (≥ md) lẫn thẻ (< md).
    expect(screen.getAllByText("07/10/2026 19:00")).toHaveLength(2);
    expect(screen.queryByText("19:00 07/10/2026")).toBeNull();
  });
});

// QA4 S18: ở 390px bảng 4 cột cắt mất "Ghi chú". Dưới md dùng thẻ, bảng chỉ từ md.
describe("MyAttendancePage — màn hẹp (S18)", () => {
  it("có danh sách thẻ md:hidden và bảng hidden md:block, thẻ hiện ghi chú đầy đủ", () => {
    attendance.note = "Xin nghỉ có giấy phép của giáo viên chủ nhiệm";
    render(<MyAttendancePage />);
    const cards = screen.getByTestId("my-attendance-cards");
    expect(cards.parentElement?.className.split(/\s+/)).toContain("md:hidden");
    const table = screen.getByTestId("my-attendance-table").className.split(/\s+/);
    expect(table).toContain("hidden");
    expect(table).toContain("md:block");
    expect(cards.textContent).toContain("Ghi chú: Xin nghỉ có giấy phép của giáo viên chủ nhiệm");
  });
});

// QA5 S5-14: bảng và thẻ phải nói điểm danh của lớp/buổi nào (khi backend trả class_name/session_title).
describe("MyAttendancePage — lớp/buổi (S5-14)", () => {
  it("có class_name: cột 'Lớp' ở bảng và dòng tên lớp ở thẻ", () => {
    attendance.class_name = "Python cơ bản K12";
    attendance.session_title = "Buổi 3";
    render(<MyAttendancePage />);
    expect(screen.getByRole("columnheader", { name: "Lớp" })).toBeTruthy();
    expect(screen.getAllByText("Python cơ bản K12 · Buổi 3")).toHaveLength(2);
  });

  it("backend cũ không có tên lớp: không dựng cột 'Lớp'", () => {
    delete attendance.class_name;
    delete attendance.session_title;
    render(<MyAttendancePage />);
    expect(screen.queryByRole("columnheader", { name: "Lớp" })).toBeNull();
  });
});
