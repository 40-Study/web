/**
 * Appearance preferences storage — persists theme, font size, and language to localStorage
 */

/** Key localStorage lưu theme đã chọn — export để dùng lại trong script chống FOUC (layout.tsx). */
export const THEME_STORAGE_KEY = "app_theme";

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
 * Gắn/gỡ class `.dark` trên thẻ `<html>` theo theme đã chọn (light | dark | system).
 * Dùng chung ở ThemeProvider (client) và script chống FOUC (layout.tsx, chạy trước hydrate).
 */
export function applyTheme(theme: string): void {
  if (typeof document === "undefined") return;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
}

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
