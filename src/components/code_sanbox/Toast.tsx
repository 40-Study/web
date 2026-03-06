"use client";
import { memo, useEffect } from "react";
import type { ToastData } from "./types";

interface Props extends ToastData {
  onClose: () => void;
}

const COLORS = { success: "#4ec9b0", error: "#f44747", info: "#007acc" };
const ICONS  = { success: "✔", error: "✖", info: "ℹ" };

const Toast = memo(({ message, type, onClose }: Props) => {
  useEffect(() => {
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", bottom: 24, right: 16, zIndex: 9999,
        background: "#252526", border: `1px solid ${COLORS[type]}`,
        borderRadius: 3, padding: "7px 14px", color: "#ccc",
        fontSize: 12, fontFamily: "'Consolas',monospace",
        boxShadow: "0 4px 14px rgba(0,0,0,.35)",
        display: "flex", alignItems: "center", gap: 8,
        animation: "toastIn .15s ease",
      }}
    >
      <span style={{ color: COLORS[type] }}>{ICONS[type]}</span>
      {message}
    </div>
  );
});
Toast.displayName = "Toast";
export default Toast;
