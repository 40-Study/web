"use client";
import { memo, useRef, useState, useCallback, type ReactNode } from "react";
import type { SplitDirection, Theme } from "./types";

interface Props {
  direction: SplitDirection;
  T: Theme;
  dark: boolean;
  first: ReactNode;
  second: ReactNode;
  /** Initial size of first panel as percentage 0–100 */
  initialRatio?: number;
  onClose?: () => void;
}

const MIN_PCT = 10; // minimum panel size %

/**
 * A resizable split container.
 * direction="vertical"   → panels side-by-side (column layout)
 * direction="horizontal" → panels top-and-bottom (row layout)
 */
const SplitView = memo(({
  direction, T, dark, first, second,
  initialRatio = 50, onClose,
}: Props) => {
  const [ratio, setRatio] = useState(initialRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      const container = containerRef.current;
      if (!container) return;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current || !container) return;
        const rect = container.getBoundingClientRect();
        let pct: number;
        if (direction === "vertical") {
          pct = ((ev.clientX - rect.left) / rect.width) * 100;
        } else {
          pct = ((ev.clientY - rect.top) / rect.height) * 100;
        }
        setRatio(Math.min(100 - MIN_PCT, Math.max(MIN_PCT, pct)));
      };

      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [direction]
  );

  const isVertical = direction === "vertical";
  const dividerSize = 4;

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: isVertical ? "row" : "column",
        flex: 1,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* First panel */}
      <div
        style={{
          [isVertical ? "width" : "height"]: `${ratio}%`,
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {first}
      </div>

      {/* Resizer */}
      <div
        onMouseDown={onMouseDown}
        style={{
          [isVertical ? "width" : "height"]: dividerSize,
          flexShrink: 0,
          background: T.border,
          cursor: isVertical ? "col-resize" : "row-resize",
          zIndex: 10,
          transition: "background .1s",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = T.accent)}
        onMouseLeave={(e) => (e.currentTarget.style.background = T.border)}
        title="Drag to resize"
      >
        {/* Grip dots */}
        <div style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          gap: 3, pointerEvents: "none",
        }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: isVertical ? 2 : 4,
              height: isVertical ? 4 : 2,
              borderRadius: 1,
              background: dark ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.25)",
            }} />
          ))}
        </div>
      </div>

      {/* Second panel */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Close split button */}
        {onClose && (
          <button
            onClick={onClose}
            title="Close split"
            style={{
              position: "absolute",
              top: 4,
              right: 6,
              zIndex: 20,
              background: "none",
              border: "none",
              color: T.textMuted,
              cursor: "pointer",
              fontSize: 14,
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
        {second}
      </div>
    </div>
  );
});
SplitView.displayName = "SplitView";
export default SplitView;
