"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedProgressBarOnScrollProps {
  /** Target width percentage (0-100) */
  targetPercent: number;
  /** Bar color class (e.g. "bg-primary-400") */
  barClassName?: string;
  /** Track background class */
  trackClassName?: string;
  /** Animation duration in ms */
  duration?: number;
  /** Height class (e.g. "h-2") */
  heightClassName?: string;
}

/**
 * Progress bar that animates width from 0 → target when scrolled into view.
 * Uses CSS transform scaleX for GPU-accelerated 60fps animation.
 */
export function AnimatedProgressBarOnScroll({
  targetPercent,
  barClassName = "bg-primary-400",
  trackClassName = "bg-slate-800",
  duration = 1200,
  heightClassName = "h-2",
}: AnimatedProgressBarOnScrollProps) {
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
    <div ref={ref} className={cn("w-full rounded-full overflow-hidden", trackClassName, heightClassName)}>
      <div
        className={cn("h-full rounded-full origin-left", barClassName)}
        style={{
          width: `${targetPercent}%`,
          transform: isVisible ? "scaleX(1)" : "scaleX(0)",
          transition: isVisible ? `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)` : "none",
        }}
      />
    </div>
  );
}
