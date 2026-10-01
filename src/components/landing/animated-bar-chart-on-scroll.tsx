"use client";

import { useRevealPhase } from "@/components/landing/use-reveal-phase";
import { cn } from "@/lib/utils";

export interface ChartBar {
  label: string;
  /** 0-100 */
  height: number;
  highlight?: boolean;
}

interface AnimatedBarChartOnScrollProps {
  bars: ChartBar[];
  className?: string;
  staggerMs?: number;
}

/** Biểu đồ cột: mỗi cột mọc từ đáy (scaleY) lần lượt khi cuộn tới. */
export function AnimatedBarChartOnScroll({
  bars,
  className,
  staggerMs = 70,
}: AnimatedBarChartOnScrollProps) {
  const { ref, phase } = useRevealPhase<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("flex items-end gap-2", className)}>
      {bars.map((bar, i) => (
        <div key={bar.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <div className="flex min-h-0 w-full flex-1 items-end">
            <div
              className={cn(
                "w-full origin-bottom rounded-t-md",
                bar.highlight
                  ? "bg-primary-600 dark:bg-primary-400"
                  : "bg-primary-200 dark:bg-primary-900"
              )}
              style={{
                height: `${bar.height}%`,
                transform: phase === "armed" ? "scaleY(0)" : "scaleY(1)",
                transition:
                  phase === "playing"
                    ? `transform 650ms cubic-bezier(0.16, 1, 0.3, 1) ${i * staggerMs}ms`
                    : "none",
              }}
            />
          </div>
          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
            {bar.label}
          </span>
        </div>
      ))}
    </div>
  );
}
