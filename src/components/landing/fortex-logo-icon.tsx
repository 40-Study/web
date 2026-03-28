"use client";

import { cn } from "@/lib/utils";

interface ForteXLogoIconProps {
  /** Size in px (default 32) */
  size?: number;
  /** Use gradient fill instead of solid color */
  gradient?: boolean;
  className?: string;
}

/**
 * ForteX "X" particle logo — premium SVG with gradient & glow.
 * Dots radiate from center in X pattern, sizes decrease outward,
 * scattered satellite dots add organic feel. Matches the original
 * ForteX brand identity (dot-cluster X motif).
 */
export function ForteXLogoIcon({ size = 32, gradient = true, className }: ForteXLogoIconProps) {
  const id = "fortex-grad";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={cn("flex-shrink-0", className)}
      aria-label="ForteX logo"
    >
      <defs>
        {gradient && (
          <>
            <radialGradient id={`${id}-r`} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#4F46E5" />
            </radialGradient>
            {/* Soft glow behind center */}
            <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="30%">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
            </radialGradient>
          </>
        )}
      </defs>

      {/* Center glow */}
      {gradient && <circle cx="60" cy="60" r="22" fill={`url(#${id}-glow)`} />}

      <g fill={gradient ? `url(#${id}-r)` : "currentColor"}>
        {/* ===== CENTER CORE ===== */}
        <circle cx="60" cy="60" r="6.5" opacity="1" />

        {/* ===== TOP-LEFT ARM ===== */}
        {/* Main spine */}
        <circle cx="51" cy="51" r="5.5" opacity="0.95" />
        <circle cx="42" cy="42" r="5" opacity="0.88" />
        <circle cx="33.5" cy="33.5" r="4.2" opacity="0.78" />
        <circle cx="25.5" cy="25.5" r="3.5" opacity="0.65" />
        <circle cx="18" cy="18" r="2.8" opacity="0.50" />
        <circle cx="12" cy="12" r="2" opacity="0.35" />
        <circle cx="7" cy="7" r="1.3" opacity="0.20" />
        {/* Scatter — above spine */}
        <circle cx="37" cy="27" r="2.8" opacity="0.55" />
        <circle cx="29" cy="19" r="2.2" opacity="0.42" />
        <circle cx="44" cy="33" r="2" opacity="0.48" />
        <circle cx="21" cy="12" r="1.6" opacity="0.30" />
        <circle cx="14" cy="7" r="1" opacity="0.18" />
        {/* Scatter — below spine */}
        <circle cx="27" cy="37" r="2.8" opacity="0.55" />
        <circle cx="19" cy="29" r="2.2" opacity="0.42" />
        <circle cx="33" cy="44" r="2" opacity="0.48" />
        <circle cx="12" cy="21" r="1.6" opacity="0.30" />
        <circle cx="7" cy="14" r="1" opacity="0.18" />

        {/* ===== TOP-RIGHT ARM ===== */}
        <circle cx="69" cy="51" r="5.5" opacity="0.95" />
        <circle cx="78" cy="42" r="5" opacity="0.88" />
        <circle cx="86.5" cy="33.5" r="4.2" opacity="0.78" />
        <circle cx="94.5" cy="25.5" r="3.5" opacity="0.65" />
        <circle cx="102" cy="18" r="2.8" opacity="0.50" />
        <circle cx="108" cy="12" r="2" opacity="0.35" />
        <circle cx="113" cy="7" r="1.3" opacity="0.20" />
        {/* Scatter — above spine */}
        <circle cx="83" cy="27" r="2.8" opacity="0.55" />
        <circle cx="91" cy="19" r="2.2" opacity="0.42" />
        <circle cx="76" cy="33" r="2" opacity="0.48" />
        <circle cx="99" cy="12" r="1.6" opacity="0.30" />
        <circle cx="106" cy="7" r="1" opacity="0.18" />
        {/* Scatter — below spine */}
        <circle cx="93" cy="37" r="2.8" opacity="0.55" />
        <circle cx="101" cy="29" r="2.2" opacity="0.42" />
        <circle cx="87" cy="44" r="2" opacity="0.48" />
        <circle cx="108" cy="21" r="1.6" opacity="0.30" />
        <circle cx="113" cy="14" r="1" opacity="0.18" />

        {/* ===== BOTTOM-LEFT ARM ===== */}
        <circle cx="51" cy="69" r="5.5" opacity="0.95" />
        <circle cx="42" cy="78" r="5" opacity="0.88" />
        <circle cx="33.5" cy="86.5" r="4.2" opacity="0.78" />
        <circle cx="25.5" cy="94.5" r="3.5" opacity="0.65" />
        <circle cx="18" cy="102" r="2.8" opacity="0.50" />
        <circle cx="12" cy="108" r="2" opacity="0.35" />
        <circle cx="7" cy="113" r="1.3" opacity="0.20" />
        {/* Scatter */}
        <circle cx="37" cy="93" r="2.8" opacity="0.55" />
        <circle cx="29" cy="101" r="2.2" opacity="0.42" />
        <circle cx="44" cy="87" r="2" opacity="0.48" />
        <circle cx="21" cy="108" r="1.6" opacity="0.30" />
        <circle cx="14" cy="113" r="1" opacity="0.18" />
        <circle cx="27" cy="83" r="2.8" opacity="0.55" />
        <circle cx="19" cy="91" r="2.2" opacity="0.42" />
        <circle cx="33" cy="76" r="2" opacity="0.48" />
        <circle cx="12" cy="99" r="1.6" opacity="0.30" />
        <circle cx="7" cy="106" r="1" opacity="0.18" />

        {/* ===== BOTTOM-RIGHT ARM ===== */}
        <circle cx="69" cy="69" r="5.5" opacity="0.95" />
        <circle cx="78" cy="78" r="5" opacity="0.88" />
        <circle cx="86.5" cy="86.5" r="4.2" opacity="0.78" />
        <circle cx="94.5" cy="94.5" r="3.5" opacity="0.65" />
        <circle cx="102" cy="102" r="2.8" opacity="0.50" />
        <circle cx="108" cy="108" r="2" opacity="0.35" />
        <circle cx="113" cy="113" r="1.3" opacity="0.20" />
        {/* Scatter */}
        <circle cx="83" cy="93" r="2.8" opacity="0.55" />
        <circle cx="91" cy="101" r="2.2" opacity="0.42" />
        <circle cx="76" cy="87" r="2" opacity="0.48" />
        <circle cx="99" cy="108" r="1.6" opacity="0.30" />
        <circle cx="106" cy="113" r="1" opacity="0.18" />
        <circle cx="93" cy="83" r="2.8" opacity="0.55" />
        <circle cx="101" cy="91" r="2.2" opacity="0.42" />
        <circle cx="87" cy="76" r="2" opacity="0.48" />
        <circle cx="108" cy="99" r="1.6" opacity="0.30" />
        <circle cx="113" cy="106" r="1" opacity="0.18" />
      </g>
    </svg>
  );
}
