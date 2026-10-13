/**
 * F-18 (QA2 261013): ngày giờ điểm danh hiện "19:00 07/10/2026" (giờ trước, ngày sau) — đọc ngược so với
 * cách người Việt viết; phải là "07/10/2026 19:00".
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const attendance = {
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
    expect(screen.getByText("07/10/2026 19:00")).toBeTruthy();
    expect(screen.queryByText("19:00 07/10/2026")).toBeNull();
  });
});
