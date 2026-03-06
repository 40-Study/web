"use client";
import { memo } from "react";
import { LANGUAGES } from "./config/languages";
import type { Theme, Language } from "./types";

interface Props {
  T: Theme;
  dark: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (fn: (v: boolean) => boolean) => void;
  lang: Language;
  setLang: (l: Language) => void;
  currentPath: string;
  currentFile: string | null;
  setThemeKey: (fn: (k: string) => string) => void;
  setSaveDialog: (v: boolean) => void;
  setSaveFileName: (v: string) => void;
  runCode: () => void;
  running: boolean;
}

// ── Reusable icon button ───────────────────────────────────────────────────────
function IconBtn({ title, onClick, active, T, dark, children }: {
  title: string; onClick: () => void; active?: boolean;
  T: Theme; dark: boolean; children: React.ReactNode;
}) {
  return (
    <button
      className="ibtn"
      title={title}
      onClick={onClick}
      style={{
        background: active ? (dark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.09)") : "none",
        border: "none",
        color: active ? T.text : T.textDim,
        cursor: "pointer",
        padding: "4px 6px",
        borderRadius: 5,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background .12s, color .12s",
      }}
    >
      {children}
    </button>
  );
}

const Sep = ({ T }: { T: Theme }) => (
  <div style={{ width: 1, height: 14, background: T.border, margin: "0 3px", flexShrink: 0 }} />
);

const TitleBar = memo(({
  T, dark, sidebarOpen, setSidebarOpen,
  lang, setLang,
  currentPath, currentFile, setThemeKey,
  setSaveDialog, setSaveFileName,
  runCode, running,
}: Props) => (
  <div style={{
    height: 38, display: "flex", alignItems: "center",
    background: T.titlebar, borderBottom: `1px solid ${T.border}`,
    padding: "0 8px", gap: 2, flexShrink: 0, userSelect: "none",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
  }}>

    {/* Logo */}
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="2" fill={T.accent}/>
        <rect x="13" y="3" width="8" height="8" rx="2" fill={T.accent} opacity=".55"/>
        <rect x="3" y="13" width="8" height="8" rx="2" fill={T.accent} opacity=".55"/>
        <rect x="13" y="13" width="8" height="8" rx="2" fill={T.accent} opacity=".3"/>
      </svg>
      <span style={{ color: T.text, fontWeight: 600, fontSize: 12.5, letterSpacing: -0.2 }}>
        40Study
      </span>
    </div>

    <Sep T={T} />

    {/* Sidebar toggle */}
    <IconBtn title="Toggle Explorer (Ctrl+B)" onClick={() => setSidebarOpen((v) => !v)} active={sidebarOpen} T={T} dark={dark}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M9 3v18"/>
      </svg>
    </IconBtn>

    <Sep T={T} />

    {/* Language selector */}
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <select
        value={lang.id}
        onChange={(e) => {
          const l = LANGUAGES.find((x) => x.id === Number(e.target.value));
          if (l) setLang(l);
        }}
        style={{
          appearance: "none", WebkitAppearance: "none",
          background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
          border: `1px solid ${T.border}`,
          color: T.text, borderRadius: 6, fontSize: 12,
          padding: "3px 24px 3px 8px",
          cursor: "pointer", height: 24,
          fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          outline: "none", fontWeight: 500,
        }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
      {/* Custom chevron */}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ position: "absolute", right: 6, pointerEvents: "none", color: T.textMuted }}>
        <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>

    <Sep T={T} />

    {/* Flex spacer + current file */}
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {currentFile && (
        <span style={{
          fontSize: 11.5, color: T.textMuted,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: 320,
        }}>
          {currentPath ? `${currentPath} / ` : ""}<span style={{ color: T.textDim, fontWeight: 500 }}>{currentFile}</span>
        </span>
      )}
    </div>

    {/* Theme toggle */}
    <IconBtn title={dark ? "Light mode" : "Dark mode"} onClick={() => setThemeKey((k) => (k === "dark" ? "light" : "dark"))} T={T} dark={dark}>
      {dark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </IconBtn>

    <Sep T={T} />

    {/* Save */}
    <IconBtn title="Save (Ctrl+S)" onClick={() => { setSaveFileName(currentFile || `untitled${lang.ext}`); setSaveDialog(true); }} T={T} dark={dark}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17,21 17,13 7,13 7,21"/>
        <polyline points="7,3 7,8 15,8"/>
      </svg>
    </IconBtn>

    {/* Run */}
    <button
      onClick={runCode}
      disabled={running}
      style={{
        background: running ? T.runBtn + "99" : T.runBtn,
        border: "none", color: "#fff", borderRadius: 6,
        padding: "4px 14px", fontSize: 12, fontWeight: 600,
        cursor: running ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 5,
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        transition: "background .12s",
        marginLeft: 2,
      }}
      onMouseEnter={(e) => { if (!running) e.currentTarget.style.background = T.runHover; }}
      onMouseLeave={(e) => { if (!running) e.currentTarget.style.background = T.runBtn; }}
    >
      {running ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
            <path d="M12 2a10 10 0 0 1 10 10"/>
          </svg>
          Running
        </>
      ) : (
        <>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <polygon points="2,1 9,5 2,9"/>
          </svg>
          Run
        </>
      )}
    </button>

  </div>
));
TitleBar.displayName = "TitleBar";
export default TitleBar;
