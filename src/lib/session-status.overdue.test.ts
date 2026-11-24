import { describe, expect, it } from "vitest";
import { SESSION_OVERDUE_LABEL, sessionStatusLabel } from "./session-status";

describe("sessionStatusLabel — buổi quá giờ (Q4-T21)", () => {
  const now = new Date("2026-11-24T12:00:00Z");
  it("scheduled nhưng giờ hẹn đã qua: không còn 'Đã lên lịch'", () => {
    expect(sessionStatusLabel("scheduled", "2026-10-11T12:00:00Z", now)).toBe(SESSION_OVERDUE_LABEL);
  });
  it("scheduled ở tương lai: giữ 'Đã lên lịch'", () => {
    expect(sessionStatusLabel("scheduled", "2026-12-01T12:00:00Z", now)).toBe("Đã lên lịch");
  });
  it("đã kết thúc thì theo trạng thái thật, không theo giờ", () => {
    expect(sessionStatusLabel("ended", "2026-10-11T12:00:00Z", now)).toBe("Đã kết thúc");
  });
  it("không truyền giờ: như cũ", () => {
    expect(sessionStatusLabel("scheduled")).toBe("Đã lên lịch");
    expect(sessionStatusLabel(undefined)).toBe("Đã lên lịch");
    expect(sessionStatusLabel("weird")).toBe("Chưa rõ");
  });
});
