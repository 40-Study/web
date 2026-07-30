import { describe, expect, it } from "vitest";
import type { SessionAttendance } from "@/services/session.service";
import { ABSENCE_WARNING_RATIO, summarizeAttendances } from "../attendance-stats";

function att(
  id: string,
  status: SessionAttendance["status"]
): SessionAttendance {
  return { id, session_id: "s1", student_id: "u1", status };
}

describe("summarizeAttendances", () => {
  it("danh sách rỗng -> mọi số bằng 0, không cảnh báo", () => {
    const s = summarizeAttendances([]);
    expect(s.total).toBe(0);
    expect(s.presentRate).toBe(0);
    expect(s.shouldWarn).toBe(false);
  });

  it("đếm đúng từng trạng thái", () => {
    const s = summarizeAttendances([
      att("1", "present"),
      att("2", "present"),
      att("3", "late"),
      att("4", "absent"),
      att("5", "excused"),
    ]);

    expect(s.total).toBe(5);
    expect(s.counts).toEqual({ present: 2, late: 1, absent: 1, excused: 1 });
  });

  it("đi trễ VẪN tính là tham dự (HS có tới lớp)", () => {
    const s = summarizeAttendances([att("1", "present"), att("2", "late")]);
    expect(s.presentRate).toBe(1);
  });

  it("vắng vượt ngưỡng -> cảnh báo", () => {
    // 2/5 = 40% > 20%
    const s = summarizeAttendances([
      att("1", "absent"),
      att("2", "absent"),
      att("3", "present"),
      att("4", "present"),
      att("5", "present"),
    ]);

    expect(s.absenceRate).toBeGreaterThan(ABSENCE_WARNING_RATIO);
    expect(s.shouldWarn).toBe(true);
  });

  it("vắng đúng bằng ngưỡng -> CHƯA cảnh báo", () => {
    // 1/5 = 20%, ngưỡng là "vượt quá" chứ không phải "bằng"
    const s = summarizeAttendances([
      att("1", "absent"),
      att("2", "present"),
      att("3", "present"),
      att("4", "present"),
      att("5", "present"),
    ]);

    expect(s.absenceRate).toBe(ABSENCE_WARNING_RATIO);
    expect(s.shouldWarn).toBe(false);
  });

  it("nghỉ có phép không tính là vắng", () => {
    const s = summarizeAttendances([
      att("1", "excused"),
      att("2", "excused"),
      att("3", "present"),
    ]);

    expect(s.absenceRate).toBe(0);
    expect(s.shouldWarn).toBe(false);
  });
});
