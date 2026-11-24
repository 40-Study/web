/**
 * QA3 Q12: nhãn thứ của heatmap hoạt động là tiếng Anh ("Sun/Tue/Thu/Sat"), "Level" thay vì "Cấp".
 */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("ActivityHeatmap — nhãn tháng hiện tại (review #127 mục 8)", () => {
  afterEach(() => vi.useRealTimers());

  it("đầu tháng (tháng hiện tại mới chiếm 1-2 tuần) vẫn có nhãn tháng hiện tại", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 5)); // 05/11/2026 (thứ Năm): tháng 11 mới chiếm 2 tuần
    const { container } = render(<ActivityHeatmap data={[]} startDate={new Date(2026, 7, 31)} />);
    const texts = Array.from(container.querySelectorAll("div.text-xs.text-muted-foreground.whitespace-nowrap")).map(
      (l) => l.textContent
    );
    expect(texts[texts.length - 1]).toBe("Tháng 11");
  });
});

describe("ActivityHeatmap — nhãn tháng không bị bẻ dòng (QA5 S5-09)", () => {
  afterEach(() => vi.useRealTimers());

  it("nhãn nowrap; tháng chỉ chiếm 1-2 tuần không in chữ", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 24)); // 24/11/2026
    // Bắt đầu 30/09 (thứ Tư): tuần đầu gồm cả cuối tháng 9 và 1/10 -> "Tháng 9" chiếm 0 tuần, bị bỏ chữ.
    const { container } = render(<ActivityHeatmap data={[]} startDate={new Date(2026, 8, 30)} />);
    const labels = Array.from(container.querySelectorAll("div.text-xs.text-muted-foreground.whitespace-nowrap"));
    const texts = labels.map((l) => l.textContent);
    expect(labels.length).toBeGreaterThan(0);
    expect(texts).toContain("Tháng 10");
    expect(texts).not.toContain("Tháng 9");
    // Mọi nhãn còn chữ đều rộng >= 3 tuần (42px) hoặc là nhãn cuối (width auto).
    labels.forEach((l) => {
      if (!l.textContent) return;
      const w = (l as HTMLElement).style.width;
      expect(w === "auto" || parseInt(w, 10) >= 42).toBe(true);
    });
  });
});
