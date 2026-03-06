import type { Theme, ThemeKey } from "../types";

export const THEMES: Record<ThemeKey, Theme> = {
  dark: {
    bg: "#1e1e1e",        sidebar: "#252526",    panel: "#1e1e1e",
    titlebar: "#1c1c1e",  tabActive: "#1e1e1e",  tabInactive: "#2d2d2d",
    tabBorder: "#636366", border: "#383838",
    text: "#e5e5ea",      textDim: "#8e8e93",    textMuted: "#636366",
    accent: "#0A84FF",    runBtn: "#0A84FF",      runHover: "#34aaff",
    success: "#30D158",   error: "#FF453A",
    inputBg: "#3a3a3c",   selectBg: "#3a3a3c",
    statusBar: "#0A84FF", lineNum: "#636366",
    scrollThumb: "#48484a", folderIcon: "#e0af68",
  },
  light: {
    bg: "#ffffff",        sidebar: "#f2f2f7",    panel: "#f5f5f7",
    titlebar: "#e8e8ed",  tabActive: "#ffffff",  tabInactive: "#f2f2f7",
    tabBorder: "#8e8e93", border: "#d1d1d6",
    text: "#1c1c1e",      textDim: "#3c3c43",    textMuted: "#8e8e93",
    accent: "#007AFF",    runBtn: "#007AFF",      runHover: "#0070ee",
    success: "#34C759",   error: "#FF3B30",
    inputBg: "#ffffff",   selectBg: "#ffffff",
    statusBar: "#007AFF", lineNum: "#8e8e93",
    scrollThumb: "#c7c7cc", folderIcon: "#FF9F0A",
  },
};
