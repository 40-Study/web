/**
 * QA3 Q12: nhãn thứ của heatmap hoạt động là tiếng Anh ("Sun/Tue/Thu/Sat"), "Level" thay vì "Cấp".
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityHeatmap, WEEKDAY_LABELS_VI, getDayOfWeek } from "./activity-heatmap";

describe("ActivityHeatmap — nhãn tiếng Việt (Q12)", () => {
  it("nhãn thứ là T2..CN, không còn tiếng Anh", () => {
    const { container } = render(<ActivityHeatmap data={[]} weeks={4} />);
    const text = container.textContent ?? "";
    expect(WEEKDAY_LABELS_VI).toEqual(["T2", "T3", "T4", "T5", "T6", "T7", "CN"]);
    ["T2", "T4", "T6", "CN"].forEach((l) => expect(screen.getByText(l)).toBeTruthy());
    expect(text).not.toMatch(/Sun|Mon|Tue|Wed|Thu|Fri|Sat/);
  });

  it("thứ Hai nằm hàng đầu, Chủ nhật hàng cuối (khớp nhãn)", () => {
    expect(getDayOfWeek(new Date(2026, 10, 2))).toBe(0); // thứ Hai 02/11/2026
    expect(getDayOfWeek(new Date(2026, 10, 8))).toBe(6); // Chủ nhật 08/11/2026
  });
});
