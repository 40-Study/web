/**
 * Q8-PG-06 / A10: axe `color-contrast` (WCAG 2.1 AA, 4.5:1) báo "Có mặt" 3.29, "Trễ" 3.18, nhãn thống kê xanh/cam/tím 2.3-3.7,
 * chữ trắng trên avatar primary-500 3.67. Test đọc CLASS thật mà component render, đổi sang màu Tailwind rồi tính tỉ lệ tương phản,
 * nên đổi lại về tint nhạt (-500/-600) là đỏ. Palette lấy từ `tailwindcss/colors` + `tailwind.config.ts` (primary tuỳ chỉnh).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import colors from "tailwindcss/colors";
import config from "../../../tailwind.config";
import { Avatar } from "@/components/ui/avatar";
import { ChildAssignmentsTab } from "./child-assignments-tab";
import { ChildAttendanceStatus } from "./child-attendance-status";

const AA = 4.5;

type Palette = Record<string, Record<string, string> | string>;
const custom = (config.theme?.extend?.colors ?? {}) as Palette;

function hex(token: string): string {
  const [hue, shade] = token.split("-");
  const entry = (colors as unknown as Palette)[hue] ?? custom[hue];
  const value = typeof entry === "string" ? entry : entry?.[shade];
  if (!value || !value.startsWith("#")) throw new Error(`Không đọc được màu cho ${token}`);
  return value;
}

function luminance(color: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(foreground: string, background: string): number {
  const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/** Token của lớp `text-<hue>-<shade>` / `bg-<hue>-<shade>` đầu tiên trong chuỗi class (bỏ qua `text-xs`, `text-white`...). */
function token(className: string, prefix: "text" | "bg"): string | null {
  return className.match(new RegExp(`(?:^|\\s)${prefix}-([a-z]+-\\d{2,3})(?:\\s|$)`))?.[1] ?? null;
}

describe("trạng thái điểm danh (Q8-PG-06)", () => {
  it.each(["present", "late", "absent", "excused"])("%s: chữ >= 4.5:1 trên nền trắng", (status) => {
    const { container } = render(<ChildAttendanceStatus status={status} />);
    const text = token(container.firstElementChild!.className, "text");
    expect(text, `không có lớp màu chữ cho ${status}`).toBeTruthy();
    expect(ratio(hex(text!), "#ffffff")).toBeGreaterThanOrEqual(AA);
  });
});

describe("ô thống kê tab Bài tập (Q8-PG-06)", () => {
  it("mọi ô: chữ >= 4.5:1 trên đúng màu nền của ô", () => {
    const data = {
      assignments: [
        { id: "a", title: "Bài", type: "code", difficulty: "easy", due_date: "2026-01-01T00:00:00Z", status: "in_progress", test_cases_passed: 0, total_test_cases: 0, submission_count: 1, best_verdict: "wrong_answer" },
      ],
      stats: { total_assignments: 4, completed: 1, in_progress: 1, not_started: 1, overdue: 1 },
      total: 1, page: 1, page_size: 20,
    };
    render(<ChildAssignmentsTab data={data} isLoading={false} />);
    const cells = ["Hoàn thành", "Cần chú ý", "Chờ chấm", "Đã nộp, chưa xong", "Chưa nộp", "Quá hạn, chưa nộp"]
      .map((label) => screen.queryByText(label)?.closest("div"))
      .filter((el): el is HTMLDivElement => el instanceof HTMLDivElement);
    expect(cells.length).toBeGreaterThanOrEqual(3);
    for (const cell of cells) {
      const text = token(cell.className, "text");
      const bg = token(cell.className, "bg");
      expect(text && bg, cell.className).toBeTruthy();
      expect(ratio(hex(text!), hex(bg!)), `${cell.className}`).toBeGreaterThanOrEqual(AA);
    }
  });
});

describe("Avatar (Q8-A10)", () => {
  it.each(["solid", "soft"] as const)("tone %s: chữ viết tắt >= 4.5:1 trên nền hình tròn", (tone) => {
    render(<Avatar fallback="Hoàng Văn E" tone={tone} />);
    const circle = screen.getByText("HE").parentElement!;
    const bg = token(circle.className, "bg")!;
    const text = token(circle.className, "text") ?? "white";
    const fg = text === "white" ? "#ffffff" : hex(text);
    expect(ratio(fg, hex(bg))).toBeGreaterThanOrEqual(AA);
  });
});
