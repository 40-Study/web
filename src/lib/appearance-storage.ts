/**
 * Appearance preferences storage — persists theme, font size, and language to localStorage
 */

/** Key localStorage lưu theme đã chọn — export để dùng lại trong script chống FOUC (layout.tsx). */
export const THEME_STORAGE_KEY = "app_theme";

/** Key localStorage lưu cỡ chữ (%) — dùng lại trong script chống FOUC (layout.tsx). */
export const FONT_SIZE_STORAGE_KEY = "app_font_size";

/** Thang cỡ chữ của thanh trượt Cài đặt > Giao diện (% của cỡ chữ gốc 16px). */
export const FONT_SIZE_MIN = 80;
export const FONT_SIZE_MAX = 150;
export const FONT_SIZE_DEFAULT = 100;

const KEYS = {
  theme: THEME_STORAGE_KEY,
  fontSize: FONT_SIZE_STORAGE_KEY,
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

/**
 * Áp cỡ chữ (%) lên `<html>`: mọi kích thước rem của Tailwind co giãn theo. Giá trị ngoài thang bị kẹp lại;
 * 100% gỡ style inline để trở về cỡ mặc định của trình duyệt/CSS.
 */
export function applyFontSize(percent: number): void {
  if (typeof document === "undefined") return;
  const clamped = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, percent));
  document.documentElement.style.fontSize = clamped === FONT_SIZE_DEFAULT ? "" : `${clamped}%`;
}

/**
 * Script chạy TRƯỚC hydrate (layout.tsx) để cỡ chữ đã lưu có hiệu lực ngay khung hình đầu, không nháy.
 * Cùng quy tắc với `getFontSize` + `applyFontSize` của ThemeProvider: đọc bằng `Number()`, giá trị
 * hỏng/0 → mặc định (bỏ qua), giá trị ngoài thang bị kẹp vào [MIN, MAX], nên không bị nhảy sau hydrate.
 */
export function fontSizeBootScript(): string {
  return `var f=Number(localStorage.getItem(${JSON.stringify(FONT_SIZE_STORAGE_KEY)}));if(f){f=Math.min(${FONT_SIZE_MAX},Math.max(${FONT_SIZE_MIN},f));if(f!==${FONT_SIZE_DEFAULT}){document.documentElement.style.fontSize=f+"%";}}`;
}

export const appearanceStorage = {
  getTheme: (): string => safeGet(KEYS.theme) ?? "system",
  setTheme: (t: string): void => {
    localStorage.setItem(KEYS.theme, t);
    applyTheme(t);
  },

  getFontSize: (): number => Number(safeGet(KEYS.fontSize)) || FONT_SIZE_DEFAULT,
  setFontSize: (s: number): void => {
    localStorage.setItem(KEYS.fontSize, String(s));
    applyFontSize(s);
  },

  getLanguage: (): string => safeGet(KEYS.language) ?? "vi",
  setLanguage: (l: string): void => localStorage.setItem(KEYS.language, l),
};
