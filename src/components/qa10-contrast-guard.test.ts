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

/** `#abc` -> `#aabbcc`. */
const expandHex = (hex: string) => (hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex);

const luminance = (rawHex: string) => {
  const hex = expandHex(rawHex);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratioOnWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

/**
 * `color: #xxx` / `#xxxxxx` trong CSS (không tính `border-color`, `background-color`). Giới hạn đã biết: chỉ hex, và chỉ so với nền
 * trắng; `rgb()`, `var()`, tên màu và nền tint/tối không được kiểm ở đây (axe live mới phủ).
 */
const cssTextColors = (css: string) =>
  [...css.matchAll(/(?<![-\w])color:\s*(#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3}))\b/g)].map((m) => expandHex(m[1].toLowerCase()));

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

  it("hồ sơ: chữ trên hero primary-600 là text-white đặc, không alpha (white/90 = 4.48:1)", () => {
    expect(read("components/profile/profile-header.tsx")).not.toMatch(/text-white\/\d+/);
  });

  it("/coins: ghi chú/trạng thái rỗng không slate-400, nhãn 9px indigo-700, '+50 xu' emerald-700, số tiền green-700", () => {
    const coins = read("app/(app)/coins/page.tsx");
    for (const c of ["text-slate-400", "text-indigo-500", "text-emerald-600", "text-green-600"]) expect(coins).not.toContain(c);
  });

  it("/my-courses tiêu đề green-700; /my-vouchers chip gray-600/red-700; huy hiệu thành tích đủ đậm cho chữ trắng", () => {
    expect(read("app/(app)/my-courses/page.tsx")).not.toContain("text-green-600");
    const vouchers = read("app/(app)/my-vouchers/page.tsx");
    expect(vouchers).not.toMatch(/bg-gray-100 text-gray-500/);
    expect(vouchers).not.toMatch(/bg-red-50 text-red-600/);
    expect(read("app/(app)/achievements/page.tsx")).not.toMatch(/color: "bg-(orange|purple|yellow)-500"|color: "bg-gray-400"/);
  });

  it("ví giáo viên: số tiền xanh có biến thể dark (green-700 trên nền tối chỉ 3.5:1)", () => {
    expect(read("app/(teacher)/teacher/wallet/transaction-display.ts")).toContain("dark:text-green-400");
    expect(read("app/(teacher)/teacher/wallet/withdrawal-section.tsx")).toContain("dark:text-green-400");
  });

  it("form tạo khoá học: lỗi role=alert không red-500; thẻ khoá học giáo viên dùng h2 (heading-order sau h1)", () => {
    const alerts = read("app/(teacher)/teacher/courses/_components/course-media-step.tsx").split("\n").filter((l) => /text-red-500/.test(l) && /role="alert"/.test(l));
    expect(alerts).toEqual([]);
    expect(read("app/(teacher)/teacher/courses/_components/course-media-step.tsx")).not.toContain("text-xs text-green-600");
    expect(read("app/(teacher)/teacher/courses/page.tsx")).not.toMatch(/<h3 className="font-semibold text-sm line-clamp-2/);
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
