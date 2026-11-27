/**
 * Q10-T-05 / Q10-STU-05 / Q10-PG-03: chữ nhạt trên nền sáng (axe `color-contrast`). jsdom không tính được tương phản nên chốt bằng
 * quét mã nguồn, cùng kiểu `settings/settings-contrast-guard.test.ts`: CSS lịch + thương mại không còn màu chữ < 4.5:1 trên nền trắng,
 * các dòng chữ đã sửa không quay lại gray-400 / green-600 / orange-500, và thẻ sự kiện lịch không dùng `<h4>` (heading-order).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratioOnWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

/** `color: #xxxxxx` trong CSS (không tính `border-color`, `background-color`). */
const cssTextColors = (css: string) =>
  [...css.matchAll(/(?<![-\w])color:\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => m[1].toLowerCase());

/** Màu chữ cố ý nhạt: dấu chọn (icon, không phải chữ). */
const DECORATIVE = new Set(["#bdc7d7"]);

describe.each(["components/schedule/calendar.css", "components/commerce/commerce.css"])("%s", (file) => {
  it("mọi màu chữ xám đạt 4.5:1 trên nền trắng (chữ trắng/đậm không tính)", () => {
    const bad = cssTextColors(read(file))
      .filter((c) => !DECORATIVE.has(c))
      .map((c) => ({ c, r: ratioOnWhite(c) }))
      .filter(({ r }) => r > 1.3 && r < 4.5);
    expect(bad).toEqual([]);
  });
});

describe("chữ đã sửa không quay lại màu nhạt", () => {
  const noClass = (file: string, cls: string, within: RegExp) => {
    const hits = read(file).split("\n").filter((l) => within.test(l) && new RegExp(`(?<![\\w:-])${cls}(?![\\w-])`).test(l));
    expect(hits.map((l) => l.trim())).toEqual([]);
  };

  it("nhãn thống kê lịch + widget học viên: gray-500+, không gray-400", () => {
    noClass("components/schedule/week-calendar-grid.tsx", "text-gray-400", /uppercase tracking-wide/);
    noClass("components/student/stats-widgets.tsx", "text-gray-400", /uppercase tracking-wide/);
    noClass("components/student/achievement-sidebar.tsx", "text-gray-400", /<p /);
  });

  it("/my-assignments + /my-vouchers: chân thẻ, giới hạn, HSD không gray-400; thẻ không dùng opacity phủ chữ lý do", () => {
    noClass("app/(app)/my-assignments/page.tsx", "text-gray-400", /<span\b/);
    noClass("app/(app)/my-vouchers/page.tsx", "text-gray-400", /text-xs|text-sm/);
    expect(read("app/(app)/my-vouchers/page.tsx")).not.toMatch(/bg-gray-50 opacity-\d+/);
  });

  it("nhãn tháng của lưới huy hiệu không gray-400", () => {
    noClass("app/(app)/achievements/page.tsx", "text-gray-400", /justify-between text-xs/);
  });

  it("số tiền thu nhập ví giáo viên dùng green-700 (5.0:1), không green-600 (3.3:1)", () => {
    expect(read("app/(teacher)/teacher/wallet/transaction-display.ts")).not.toContain("text-green-600");
    expect(read("app/(teacher)/teacher/wallet/withdrawal-section.tsx")).not.toContain("text-green-600");
  });

  it("huy hiệu 'NỔI BẬT' không trắng trên cam-500 (2.8:1)", () => {
    expect(read("app/(teacher)/teacher/courses/page.tsx")).not.toMatch(/bg-orange-(500|600)[^"]*text-white/);
  });

  it("số bước chưa tới (gray-200) dùng gray-600; dấu * bắt buộc dùng red-600", () => {
    expect(read("app/(teacher)/teacher/courses/create/page.tsx")).not.toContain('"bg-gray-200 text-gray-500"');
    for (const f of ["course-media-step", "course-basic-info-step"]) {
      expect(read(`app/(teacher)/teacher/courses/_components/${f}.tsx`)).not.toMatch(/text-red-500">\*/);
    }
  });

  it("hồ sơ: tên đăng nhập/ngày tham gia không opacity-80 (3.9:1); ô thống kê phụ huynh gray-600 trên nền tint", () => {
    expect(read("components/profile/profile-header.tsx")).not.toMatch(/<(p|div)[^>]*opacity-80/);
    for (const f of ["child-attendance-tab", "child-assignments-tab"]) {
      expect(read(`components/parent/${f}.tsx`)).not.toMatch(/text-xs text-gray-500">\{label}/);
    }
  });

  it("/discussions: số đếm trên nền primary-50 dùng slate-600", () => {
    const sidebar = read("app/(main)/discussions/discussion-sidebar.tsx");
    expect(sidebar).not.toMatch(/text-xs text-slate-500">\{(total|cat\.count)/);
  });

  it("thẻ sự kiện lịch dùng <p>, không <h4> ngay sau h1 (axe heading-order)", () => {
    expect(read("components/schedule/calendar-event-card.tsx")).not.toMatch(/<h[1-6]\b/);
  });
});
