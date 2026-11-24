import { describe, expect, it } from "vitest";
import { formatCompletedMonth } from "./format-completed-month";

describe("formatCompletedMonth (S5-08)", () => {
  it("'Hoàn thành tháng 10/2026', không còn 'thg'", () => {
    const out = formatCompletedMonth(new Date(2026, 9, 8).toISOString());
    expect(out).toBe("Hoàn thành tháng 10/2026");
    expect(out).not.toContain("thg");
  });

  it("thiếu hoặc không hợp lệ -> chuỗi rỗng", () => {
    expect(formatCompletedMonth(undefined)).toBe("");
    expect(formatCompletedMonth("không phải ngày")).toBe("");
  });
});
