"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BarData {
  height: number; // percentage 0-100
  highlight?: boolean;
}

interface AnimatedBarChartOnScrollProps {
  bars: BarData[];
  /** Highlight bar color class */
  highlightClassName?: string;
  /** Normal bar color class */
  barClassName?: string;
  /** Container height class */
  heightClassName?: string;
  /** Stagger delay between bars in ms */
  staggerDelay?: number;
}

/**
 * Bar chart that animates each bar from 0 → target height on scroll.
 * Uses CSS transform scaleY for GPU-accelerated 60fps animation.
 */
export function AnimatedBarChartOnScroll({
  bars,
  highlightClassName = "bg-orange-500",
  barClassName = "bg-slate-100",
  heightClassName = "h-32",
  staggerDelay = 80,
}: AnimatedBarChartOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("flex items-end gap-3 px-4", heightClassName)}>
      {bars.map((bar, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 rounded-t-md origin-bottom",
            bar.highlight ? highlightClassName : barClassName
          )}
          style={{
            height: `${bar.height}%`,
            transform: isVisible ? "scaleY(1)" : "scaleY(0)",
            transition: isVisible
              ? `transform 700ms cubic-bezier(0.16, 1, 0.3, 1) ${i * staggerDelay}ms`
              : "none",
          }}
        />
      ))}
    </div>
  );
}
