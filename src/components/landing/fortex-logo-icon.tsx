"use client";
import { cn } from "@/lib/utils";
import { useId } from "react";

interface ForteXLogoIconProps {
  size?: number;
  gradient?: boolean;
  animated?: boolean;
  className?: string;
}

/**
 * ForteX "X" particle logo - Rebuilt to perfectly match the 1-3-3-1 matrix image.
 * The dots follow a strict checkerboard grid (x+y = even) with empty main axes.
 * Format: [cx, cy, radius]
 */
const DOTS: [number, number, number][] = [
  // ═══ CENTER ═══
  [50, 50, 8],

  // ═══ TOP-LEFT ARM ═══
  [41.5, 41.5, 6], // Inner 1
  [33, 33, 5], [41.5, 24.5, 3.5], [24.5, 41.5, 3.5], // Group 3 (Spine + Flanks)
  [24.5, 24.5, 3.5], [33, 16, 2.5], [16, 33, 2.5], // Group 3 (Spine + Flanks)
  [16, 16, 1.8], // Tip 1

  // ═══ TOP-RIGHT ARM ═══
  [58.5, 41.5, 6],
  [67, 33, 5], [58.5, 24.5, 3.5], [75.5, 41.5, 3.5],
  [75.5, 24.5, 3.5], [67, 16, 2.5], [84, 33, 2.5],
  [84, 16, 1.8],

  // ═══ BOTTOM-LEFT ARM ═══
  [41.5, 58.5, 6],
  [33, 67, 5], [41.5, 75.5, 3.5], [24.5, 58.5, 3.5],
  [24.5, 75.5, 3.5], [33, 84, 2.5], [16, 67, 2.5],
  [16, 84, 1.8],

  // ═══ BOTTOM-RIGHT ARM ═══
  [58.5, 58.5, 6],
  [67, 67, 5], [58.5, 75.5, 3.5], [75.5, 58.5, 3.5],
  [75.5, 75.5, 3.5], [67, 84, 2.5], [84, 67, 2.5],
  [84, 84, 1.8],
];

export function ForteXLogoIcon({
  size = 32,
  gradient = true,
  animated = false,
  className,
}: ForteXLogoIconProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={cn("flex-shrink-0", className)}
      aria-label="ForteX logo"
    >
      {gradient && (
        <defs>
          <radialGradient id={`fg-${uid}`} cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#4F46E5" />
          </radialGradient>
          {animated && (
            <style>{`
              @keyframes dp-${uid} {
                0%, 100% { opacity: var(--o); transform: scale(1); }
                50% { opacity: calc(var(--o) * 0.65); transform: scale(0.88); }
              }
            `}</style>
          )}
        </defs>
      )}
      <g fill={gradient ? `url(#fg-${uid})` : "currentColor"}>
        {DOTS.map(([cx, cy, r], i) => {
          const dist = Math.sqrt((cx - 50) ** 2 + (cy - 50) ** 2);
          // Giữ nguyên logic tính opacity (nếu bạn muốn các hạt ngoài cùng đậm hơn, có thể thay số 65 thành 80 hoặc 90)
          const opacity = Math.max(0.25, 1 - dist / 65);
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              opacity={opacity}
              style={
                animated
                  ? ({
                    "--o": opacity,
                    transformOrigin: `${cx}px ${cy}px`,
                    animation: `dp-${uid} ${2.2 + (i % 4) * 0.5}s ease-in-out ${(i % 7) * 0.18}s infinite`,
                  } as React.CSSProperties)
                  : undefined
              }
            />
          );
        })}
      </g>
    </svg>
  );
}