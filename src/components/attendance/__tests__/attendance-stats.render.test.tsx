/**
 * F-09 (QA2 261013): các thẻ chuyên cần cộng lại phải bằng "Tổng buổi" — thiếu thẻ "Có phép" thì
 * 17 + 4 + 1 = 22 ≠ 23. Test render thật (không chỉ summarize) để thẻ bị bỏ khỏi UI làm test đỏ.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SessionAttendance } from "@/services/session.service";
import { AttendanceStats, summarizeAttendances } from "../attendance-stats";

function rows(status: SessionAttendance["status"], n: number): SessionAttendance[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${status}-${i}`,
    session_id: "s1",
    student_id: "u1",
    status,
  }));
}

function cardValue(label: string): number {
  const value = screen.getByText(label).nextElementSibling?.textContent;
  return Number(value);
}

describe("AttendanceStats", () => {
  it("hiện đủ thẻ Có mặt / Đi trễ / Vắng / Có phép và chúng cộng lại bằng Tổng buổi", () => {
    const summary = summarizeAttendances([
      ...rows("present", 17),
      ...rows("late", 4),
      ...rows("absent", 1),
      ...rows("excused", 1),
    ]);
    render(<AttendanceStats summary={summary} />);

    const parts = ["Có mặt", "Đi trễ", "Vắng", "Có phép"].map(cardValue);
    expect(parts).toEqual([17, 4, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(cardValue("Tổng buổi"));
  });
});
