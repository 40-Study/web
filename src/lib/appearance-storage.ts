/**
 * Appearance preferences storage — persists theme, font size, and language to localStorage
 */

/** Key localStorage lưu theme đã chọn — export để dùng lại trong script chống FOUC (layout.tsx). */
export const THEME_STORAGE_KEY = "app_theme";

/** Media query của hệ điều hành cho chế độ tối. "system" đi theo query này. */
export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

const KEYS = {
  theme: THEME_STORAGE_KEY,
  fontSize: "app_font_size",
  language: "app_language",
} as const;

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

/**
 * Quy tắc duy nhất quyết định có bật dark hay không. Chưa lưu gì (null) coi như "system".
 * Script chống FOUC (THEME_INIT_SCRIPT) chép lại đúng quy tắc này — sửa ở đây thì sửa cả ở đó.
 */
export function isDarkTheme(theme: string | null, systemPrefersDark: boolean): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return systemPrefersDark;
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(DARK_SCHEME_QUERY).matches;
}

/**
 * Gắn/gỡ class `.dark` trên thẻ `<html>` theo theme đã chọn (light | dark | system).
 * "system" theo prefers-color-scheme của hệ điều hành; ThemeProvider lắng nghe khi OS đổi.
 * `color-scheme` để thanh cuộn, ô nhập gốc của trình duyệt cũng đổi theo.
 */
export function applyTheme(theme: string | null): void {
  if (typeof document === "undefined") return;
  const dark = isDarkTheme(theme, systemPrefersDark());
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

/**
 * Script chạy TRƯỚC khi React hydrate (layout.tsx) để không nháy màn sáng khi đang ở chế độ tối.
 * Phải cùng quy tắc với isDarkTheme ở trên.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});var d=t==="dark"||(t!=="light"&&!!window.matchMedia&&window.matchMedia(${JSON.stringify(
  DARK_SCHEME_QUERY
)}).matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export const appearanceStorage = {
  getTheme: (): string => safeGet(KEYS.theme) ?? "system",
  setTheme: (t: string): void => {
    localStorage.setItem(KEYS.theme, t);
    applyTheme(t);
  },

  getFontSize: (): number => Number(safeGet(KEYS.fontSize)) || 100,
  setFontSize: (s: number): void => localStorage.setItem(KEYS.fontSize, String(s)),

  getLanguage: (): string => safeGet(KEYS.language) ?? "vi",
  setLanguage: (l: string): void => localStorage.setItem(KEYS.language, l),
};
