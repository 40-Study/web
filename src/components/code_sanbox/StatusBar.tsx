"use client";
import { memo } from "react";
import type { Theme, Language } from "./types";

interface Props {
  T: Theme;
  dark: boolean;
  currentPath: string;
  lang: Language;
  lineCount: number;
  setThemeKey: (fn: (k: string) => string) => void;
}

const StatusBar = memo(({ T, dark, currentPath, lang, lineCount, setThemeKey }: Props) => (
  <div
    style={{
      height: 22,
      background: T.statusBar,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      padding: "0 12px",
      fontSize: 11,
      gap: 16,
      flexShrink: 0,
      userSelect: "none",
      fontFamily: "var(--font-mono)",
    }}
  >
    <span>{currentPath || "~"}</span>
    <span>{lang.name}</span>
    <div style={{ flex: 1 }} />
    <span>{lineCount} lines</span>
    <span>UTF-8</span>
    <span
      style={{ cursor: "pointer" }}
      onClick={() => setThemeKey((k) => (k === "dark" ? "light" : "dark"))}
    >
      {dark ? "Dark+" : "Light+"}
    </span>
  </div>
));
StatusBar.displayName = "StatusBar";
export default StatusBar;
