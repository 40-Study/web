"use client";

import { useRevealPhase } from "@/components/landing/use-reveal-phase";
import { cn } from "@/lib/utils";

interface AnimatedProgressBarOnScrollProps {
  percent: number;
  className?: string;
  barClassName?: string;
  duration?: number;
}

/** Thanh tiến độ chạy 0 → percent khi cuộn tới (transform, không layout). */
export function AnimatedProgressBarOnScroll({
  percent,
  className,
  barClassName,
  duration = 1000,
}: AnimatedProgressBarOnScrollProps) {
  const { ref, phase } = useRevealPhase<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("h-1.5 overflow-hidden rounded-full", className)}>
      <div
        className={cn("h-full origin-left rounded-full", barClassName)}
        style={{
          width: `${percent}%`,
          transform: phase === "armed" ? "scaleX(0)" : "scaleX(1)",
          transition:
            phase === "playing"
              ? `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`
              : "none",
        }}
      />
    </div>
  );
}
