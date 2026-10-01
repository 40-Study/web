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
 * ForteX "folded X" logo — hai dải chéo cắt đầu ngang kiểu chữ in (viewBox 100x100).
 * Phần giao nhau được tô đậm hơn (clip theo dải "\") để tạo cảm giác một dải giấy gấp chéo.
 * Favicon tĩnh ở src/app/icon2.svg (+ icon1.png, apple-icon.png render từ nó) — đổi logo thì đổi cả ở đó.
 */
const BAND_BACKSLASH = "M14 12H36L86 88H64Z";
const BAND_SLASH = "M64 12H86L36 88H14Z";

export function ForteXLogoIcon({
  size = 32,
  gradient = true,
  animated = false,
  className,
}: ForteXLogoIconProps) {
  const uid = useId().replace(/:/g, "");

  // Bám theo tailwind.config.ts: primary blue-400/500/700, secondary sky-300/500, nếp gấp blue-800.
  // gradient=false → đơn sắc theo currentColor, nếp gấp phân biệt bằng opacity.
  const backslashFill = gradient ? `url(#fx-p-${uid})` : "currentColor";
  const slashFill = gradient ? `url(#fx-s-${uid})` : "currentColor";
  const foldFill = gradient ? "#1e40af" : "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={cn("flex-shrink-0", className)}
      aria-label="ForteX logo"
    >
      <defs>
        {gradient && (
          <>
            <linearGradient id={`fx-p-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id={`fx-s-${uid}`} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </>
        )}
        <clipPath id={`fx-c-${uid}`}>
          <path d={BAND_BACKSLASH} />
        </clipPath>
        {animated && (
          <style>{`
            @keyframes fx-fold-${uid} { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
            .fx-fold-${uid} { animation: fx-fold-${uid} 2.4s ease-in-out infinite; }
            @media (prefers-reduced-motion: reduce) { .fx-fold-${uid} { animation: none; } }
          `}</style>
        )}
      </defs>
      <path d={BAND_BACKSLASH} fill={backslashFill} />
      <path d={BAND_SLASH} fill={slashFill} opacity={gradient ? 1 : 0.55} />
      <path
        d={BAND_SLASH}
        fill={foldFill}
        clipPath={`url(#fx-c-${uid})`}
        className={animated ? `fx-fold-${uid}` : undefined}
      />
    </svg>
  );
}
