/**
 * Q9-ADMIN-03 / Q9-PG-07: axe báo 4.45-4.49:1 cho chữ `text-muted-foreground` (slate-500 #64748b) trên nền near-white /
 * gray-50, và 4.29 trên chính `--muted`. jsdom không tính được tương phản nên test đọc token thật trong globals.css và
 * tính tỉ lệ WCAG: đổi lại về slate-500 là đỏ.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");
const root = css.slice(css.indexOf(":root"), css.indexOf(".dark"));

function hslToken(name: string): [number, number, number] {
  const m = root.match(new RegExp(`--${name}:\\s*(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)%\\s+(\\d+(?:\\.\\d+)?)%`));
  if (!m) throw new Error(`Không đọc được --${name} trong :root`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function toRgb([h, s, l]: [number, number, number]): number[] {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

function luminance(rgb: number[]): number {
  const [r, g, b] = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg: number[], bg: number[]): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const GRAY_50 = [249 / 255, 250 / 255, 251 / 255];
const WHITE = [1, 1, 1];

describe("--muted-foreground (:root) đạt AA 4.5:1", () => {
  const fg = toRgb(hslToken("muted-foreground"));

  it.each([
    ["trắng", WHITE],
    ["gray-50", GRAY_50],
    ["--muted (slate-100)", toRgb(hslToken("muted"))],
  ])("trên %s", (_name, bg) => {
    expect(ratio(fg, bg as number[])).toBeGreaterThanOrEqual(4.5);
  });
});
