"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterOnScrollProps {
  /** Target number to count to */
  target: number;
  /** Animation duration in ms (default 1500) */
  duration?: number;
  /** Format function for display (e.g. add commas, suffix) */
  formatter?: (value: number) => string;
  /** CSS class for the number */
  className?: string;
  /** Suffix text after the number (e.g. "đ", "%", "+") */
  suffix?: string;
  /** Prefix text before the number (e.g. "+") */
  prefix?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animated counter that triggers only when scrolled into view.
 * Uses requestAnimationFrame for smooth 60fps animation.
 */
export function AnimatedCounterOnScroll({
  target,
  duration = 1500,
  formatter,
  className,
  suffix,
  prefix,
}: AnimatedCounterOnScrollProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.disconnect();

          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);
            setCount(Math.round(eased * target));

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  const displayValue = formatter ? formatter(count) : count.toString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
