/**
 * Appearance preferences storage — persists theme, font size, and language to localStorage
 */

const KEYS = {
  theme: "app_theme",
  fontSize: "app_font_size",
  language: "app_language",
} as const;

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

export const appearanceStorage = {
  getTheme: (): string => safeGet(KEYS.theme) ?? "system",
  setTheme: (t: string): void => localStorage.setItem(KEYS.theme, t),

  getFontSize: (): number => Number(safeGet(KEYS.fontSize)) || 100,
  setFontSize: (s: number): void => localStorage.setItem(KEYS.fontSize, String(s)),

  getLanguage: (): string => safeGet(KEYS.language) ?? "vi",
  setLanguage: (l: string): void => localStorage.setItem(KEYS.language, l),
};
