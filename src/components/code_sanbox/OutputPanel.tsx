"use client";
import { memo, useState, useCallback } from "react";
import type { Theme, JudgeResult } from "./types";

interface Props {
  T: Theme;
  dark: boolean;
  stdin: string;
  setStdin: (v: string) => void;
  running: boolean;
  result: JudgeResult | null;
  setResult: (v: JudgeResult | null) => void;
  height: number;
}

const OutputPanel = memo(({
  T, dark, stdin, setStdin,
  running, result, setResult, height,
}: Props) => {
  const raw   = result?.stdout || result?.stderr || result?.compile_output || "";
  const isErr = (result?.status?.id ?? 0) > 3;

  const [stdinW, setStdinW] = useState(220);

  const startDragStdin = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const x0 = e.clientX;
    const w0 = stdinW;
    const mv = (ev: MouseEvent) => setStdinW(Math.max(80, Math.min(520, w0 + (x0 - ev.clientX))));
    const up = () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
  }, [stdinW]);

  return (
    <div
      style={{
        height, flexShrink: 0, display: "flex",
        flexDirection: "column", background: T.panel, overflow: "hidden",
      }}
    >
      {/* Two-column body: Output | Stdin */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Output column ──────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: `1px solid ${T.border}` }}>
          {/* Header */}
          <div style={{
            height: 28, display: "flex", alignItems: "center", gap: 8,
            padding: "0 12px", background: T.sidebar,
            borderBottom: `1px solid ${T.border}`, flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: 0.5, textTransform: "uppercase" }}>
              Output
            </span>
            <div style={{ flex: 1 }} />
            {result && (
              <span style={{ fontSize: 11, fontWeight: 600, color: isErr ? T.error : T.success, fontFamily: "var(--font-mono)" }}>
                {result.status?.description}
                {result.time && <span style={{ color: T.textMuted, fontWeight: 400 }}>{" "}· {(parseFloat(result.time) * 1000).toFixed(0)}ms</span>}
                {result.memory && <span style={{ color: T.textMuted, fontWeight: 400 }}>{" "}· {(result.memory / 1024).toFixed(1)}MB</span>}
              </span>
            )}
            <button className="ibtn" onClick={() => setResult(null)} title="Clear"
              style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", padding: "1px 6px", borderRadius: 2, fontSize: 13 }}>
              ⊗
            </button>
          </div>
          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px" }}>
            {!result && !running && <span style={{ color: T.textMuted, fontSize: 12 }}>Press ▶ Run or Ctrl+Enter</span>}
            {running && (
              <span style={{ color: T.textDim, fontSize: 12 }}>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite", marginRight: 6 }}>◌</span>
                Executing…
              </span>
            )}
            {result && (
              <pre style={{
                color: isErr ? T.error : dark ? "#d4d4d4" : "#1f1f1f",
                fontSize: 12, lineHeight: "1.7", whiteSpace: "pre-wrap",
                fontFamily: "var(--font-mono)", margin: 0,
              }}>
                {raw || <span style={{ color: T.textMuted }}>(no output)</span>}
              </pre>
            )}
          </div>
        </div>

        {/* ── Stdin resize handle ───────────────────────────────── */}
        <div
          onMouseDown={startDragStdin}
          title="Drag to resize stdin"
          style={{
            width: 4, cursor: "col-resize", flexShrink: 0,
            background: "transparent", transition: "background .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        />

        {/* ── Stdin column ───────────────────────────────────────── */}
        <div style={{ width: stdinW, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Header */}
          <div style={{
            height: 28, display: "flex", alignItems: "center",
            padding: "0 12px", background: T.sidebar,
            borderBottom: `1px solid ${T.border}`, flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textDim, letterSpacing: 0.5, textTransform: "uppercase" }}>
              Stdin
            </span>
          </div>
          {/* Textarea */}
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="stdin input…"
            style={{
              flex: 1, background: "transparent", border: "none",
              resize: "none", padding: "8px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: 12, lineHeight: "1.6",
              color: T.text,
            }}
            spellCheck={false}
          />
        </div>

      </div>
    </div>
  );
});
OutputPanel.displayName = "OutputPanel";
export default OutputPanel;

