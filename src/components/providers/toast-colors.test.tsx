/**
 * Q11-STU-03: chữ toast Sonner >= 4.5:1 cho CẢ bốn loại. Đo trên nền thật lấy từ `styles.css` của Sonner (không chép tay
 * nền), nên đổi phiên bản Sonner mà nền đổi thì test đo lại; và test mặc định (không override) phải ĐỎ để chứng minh phép đo.
 */
import { readFileSync } from "node:fs";
import { act, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { TOAST_TEXT_COLORS, type ToastKind } from "./toast-colors";
import { Providers } from "./index";

vi.mock("./auth-bootstrap", () => ({ AuthBootstrap: () => null }));

const KINDS = Object.keys(TOAST_TEXT_COLORS) as ToastKind[];
const AA = 4.5;

const css = readFileSync(require.resolve("sonner/dist/styles.css"), "utf8");
const lightBlock = css.slice(css.indexOf("[data-sonner-theme=light]") >= 0 ? css.indexOf("[data-sonner-theme=light]") : css.indexOf("[data-sonner-theme='light']"));

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}
function hexToRgb(hex: string): [number, number, number] {
  const n = (i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  return [n(0), n(1), n(2)];
}
function luminance([r, g, b]: [number, number, number]) {
  const c = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
function ratio(a: [number, number, number], b: [number, number, number]) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function sonnerVar(name: string): [number, number, number] {
  const m = lightBlock.match(new RegExp(`--${name}:\\s*hsl\\((\\d+),\\s*(\\d+)%,\\s*(\\d+)%\\)`));
  if (!m) throw new Error(`Sonner styles.css không có --${name} (theme sáng)`);
  return hslToRgb(Number(m[1]), Number(m[2]), Number(m[3]));
}

describe("toast rich colors (Q11-STU-03)", () => {
  it.each(KINDS)("%s: chữ >= 4.5:1 trên nền Sonner", (kind) => {
    expect(ratio(hexToRgb(TOAST_TEXT_COLORS[kind]), sonnerVar(`${kind}-bg`))).toBeGreaterThanOrEqual(AA);
  });

  it("phép đo bắt được lỗi: bảng chữ mặc định của Sonner dưới 4.5:1 ở cả bốn loại", () => {
    for (const kind of KINDS) {
      expect(ratio(sonnerVar(`${kind}-text`), sonnerVar(`${kind}-bg`))).toBeLessThan(AA);
    }
  });

  it("Providers (Toaster thật của app) nhận bốn biến chữ: không chỉ định nghĩa mà không nối", async () => {
    render(<Providers>{null}</Providers>);
    act(() => void toast.info("Phiên đăng nhập đã hết hạn"));
    await screen.findByText("Phiên đăng nhập đã hết hạn");
    const ol = document.querySelector("[data-sonner-toaster]") as HTMLElement | null;
    expect(ol).not.toBeNull();
    for (const kind of KINDS) {
      expect(ol!.style.getPropertyValue(`--${kind}-text`)).toBe(TOAST_TEXT_COLORS[kind]);
    }
  });
});
