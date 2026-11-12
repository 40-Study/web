/**
 * UX-A-06: "Hệ thống" phải theo cài đặt sáng/tối của hệ điều hành (prefers-color-scheme),
 * kể cả khi OS đổi lúc trang đang mở. "Sáng"/"Tối" chọn tay thì không bị OS ghi đè.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "./theme-provider";
import { DARK_SCHEME_QUERY, THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "@/lib/appearance-storage";

type Listener = (e: { matches: boolean }) => void;

/** Giả lập matchMedia có thể đổi trạng thái OS và phát sự kiện "change" như trình duyệt thật. */
function mockOsScheme(initialDark: boolean) {
  const state = { dark: initialDark, listeners: new Set<Listener>() };
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      get matches() {
        return query === DARK_SCHEME_QUERY ? state.dark : false;
      },
      media: query,
      addEventListener: (_: string, l: Listener) => state.listeners.add(l),
      removeEventListener: (_: string, l: Listener) => state.listeners.delete(l),
    }))
  );
  return {
    setDark(dark: boolean) {
      state.dark = dark;
      state.listeners.forEach((l) => l({ matches: dark }));
    },
    listenerCount: () => state.listeners.size,
  };
}

const html = () => document.documentElement;

beforeEach(() => {
  localStorage.clear();
  html().classList.remove("dark");
  html().style.colorScheme = "";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ThemeProvider — chế độ Hệ thống theo OS", () => {
  it("chưa chọn gì + OS tối → bật dark", () => {
    mockOsScheme(true);
    render(<ThemeProvider />);
    expect(html().classList.contains("dark")).toBe(true);
    expect(html().style.colorScheme).toBe("dark");
  });

  it("'system' + OS tối → bật dark; OS đổi sang sáng khi trang đang mở → tắt dark", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "system");
    const os = mockOsScheme(true);
    render(<ThemeProvider />);
    expect(html().classList.contains("dark")).toBe(true);

    act(() => os.setDark(false));
    expect(html().classList.contains("dark")).toBe(false);

    act(() => os.setDark(true));
    expect(html().classList.contains("dark")).toBe(true);
  });

  it("'light' chọn tay không bị OS tối ghi đè, kể cả khi OS đổi", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    const os = mockOsScheme(true);
    render(<ThemeProvider />);
    expect(html().classList.contains("dark")).toBe(false);
    act(() => os.setDark(false));
    act(() => os.setDark(true));
    expect(html().classList.contains("dark")).toBe(false);
  });

  it("'dark' chọn tay giữ tối khi OS sáng", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    mockOsScheme(false);
    render(<ThemeProvider />);
    expect(html().classList.contains("dark")).toBe(true);
  });

  it("gỡ listener khi unmount", () => {
    const os = mockOsScheme(false);
    const { unmount } = render(<ThemeProvider />);
    expect(os.listenerCount()).toBe(1);
    unmount();
    expect(os.listenerCount()).toBe(0);
  });
});

describe("THEME_INIT_SCRIPT (chống nháy trước hydrate) cùng quy tắc", () => {
  const run = () => new Function(THEME_INIT_SCRIPT)();

  it.each([
    [null, true, true],
    [null, false, false],
    ["system", true, true],
    ["system", false, false],
    ["light", true, false],
    ["dark", false, true],
  ])("theme=%s, OS tối=%s → dark=%s", (theme, osDark, expected) => {
    if (theme) localStorage.setItem(THEME_STORAGE_KEY, theme);
    mockOsScheme(osDark);
    run();
    expect(html().classList.contains("dark")).toBe(expected);
  });
});
