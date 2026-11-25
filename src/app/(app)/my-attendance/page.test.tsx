/**
 * F-18 (QA2 261013): ngày giờ điểm danh hiện "19:00 07/10/2026" (giờ trước, ngày sau) — đọc ngược so với
 * cách người Việt viết; phải là "07/10/2026 19:00".
 */
import { render, screen, within } from "@testing-library/react";
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

// QA7 S7-01 (C15): cột "Thời gian" là giờ BẮT ĐẦU của buổi, không phải lúc đánh dấu (vắng/có phép từng hiện giờ kết thúc).
describe("MyAttendancePage — giờ của buổi học (S7-01)", () => {
  it("có session_start_time: hiện giờ bắt đầu buổi thay vì check_in/created_at", () => {
    attendance.status = "absent";
    attendance.session_start_time = "2026-11-24T19:30:00+07:00";
    attendance.created_at = "2026-11-24T21:30:00+07:00";
    delete attendance.check_in_time;
    render(<MyAttendancePage />);
    expect(screen.getAllByText("24/11/2026 19:30")).toHaveLength(2);
    expect(screen.queryByText("24/11/2026 21:30")).toBeNull();
  });

  it("dòng đi trễ giữ giờ vào lớp ở dòng phụ", () => {
    attendance.status = "late";
    attendance.session_start_time = "2026-11-24T19:30:00+07:00";
    attendance.check_in_time = "2026-11-24T19:42:00+07:00";
    render(<MyAttendancePage />);
    expect(screen.getAllByText("24/11/2026 19:30", { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vào lớp lúc 24/11/2026 19:42")).toHaveLength(2);
  });

  it("backend cũ (không có session_start_time): rơi về check_in_time ?? created_at", () => {
    attendance.status = "present";
    delete attendance.session_start_time;
    attendance.check_in_time = "2026-11-24T19:05:00+07:00";
    render(<MyAttendancePage />);
    expect(screen.getAllByText("24/11/2026 19:05")).toHaveLength(2);
    expect(screen.queryByText(/Vào lớp lúc/)).toBeNull();
  });
});

// QA7 S7-02: "Có phép" không được xuống dòng trong pill; tiêu đề cột cũng không.
describe("MyAttendancePage — pill trạng thái một dòng (S7-02)", () => {
  it("pill và tiêu đề cột Trạng thái có whitespace-nowrap", () => {
    attendance.status = "excused";
    render(<MyAttendancePage />);
    for (const root of [screen.getByTestId("my-attendance-table"), screen.getByTestId("my-attendance-cards")]) {
      const pill = within(root).getByText("Có phép");
      expect(pill.className.split(/\s+/)).toContain("whitespace-nowrap");
    }
    expect(screen.getByRole("columnheader", { name: "Trạng thái" }).className.split(/\s+/)).toContain("whitespace-nowrap");
  });
});
