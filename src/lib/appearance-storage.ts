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
 *
 * "system" hiện được coi là SÁNG, KHÔNG theo prefers-color-scheme của hệ điều hành: bộ giao
 * diện tối mới chỉ có token màu nền/chữ, phần lớn component vẫn dùng màu sáng cố định
 * (bg-white, text-slate-*), nên theo OS tối sẽ ra màn hình nửa xám nửa trắng (báo cáo
 * 11/09/2026, trang chủ). Chỉ bật khi người dùng chủ động chọn "Tối" trong Cài đặt. Khi
 * giao diện tối được hoàn thiện, đổi lại thành `theme === "system" && prefersDark`.
 */
export function applyTheme(theme: string): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
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
