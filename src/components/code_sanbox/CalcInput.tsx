"use client";
import { memo, useState } from "react";
import type { Theme } from "./types";

interface Props {
  T: Theme;
}

const CalcInput = memo(({ T }: Props) => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  const calc = () => {
    if (!input.trim()) return;
    const t0 = performance.now();
    try {
      // Safe expression evaluation: only allow numbers, operators and parens
      if (!/^[\d\s+\-*/.%^()e]+$/i.test(input)) {
        setResult("Error: invalid expression");
        return;
      }
      // eslint-disable-next-line no-new-func
      const val = new Function(`"use strict"; return (${input})`)();
      const ms = (performance.now() - t0).toFixed(2);
      setResult(`= ${val}  (${ms} ms)`);
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    }
  };

  return (
    <div
      style={{
        borderTop: `1px solid ${T.border}`,
        padding: "5px 10px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: T.panel,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0 }}>calc</span>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && calc()}
        placeholder="2 + 3 * 4"
        style={{
          flex: 1,
          background: T.inputBg,
          border: `1px solid ${T.border}`,
          borderRadius: 2,
          padding: "3px 8px",
          color: T.text,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
        }}
      />
      <button
        onClick={calc}
        style={{
          background: T.runBtn,
          border: "none",
          color: "#fff",
          borderRadius: 2,
          padding: "3px 10px",
          fontSize: 12,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        =
      </button>
      {result && (
        <span style={{ fontSize: 12, color: T.success, fontFamily: "var(--font-mono)", flexShrink: 0 }}>
          {result}
        </span>
      )}
    </div>
  );
});
CalcInput.displayName = "CalcInput";
export default CalcInput;
