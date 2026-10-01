"use client";

import { useEffect, useState } from "react";
import { easeOutCubic, useRevealPhase } from "@/components/landing/use-reveal-phase";

interface AnimatedCounterOnScrollProps {
  target: number;
  duration?: number;
  /** Định dạng số hiển thị (ví dụ dấu chấm ngăn cách hàng nghìn). */
  format?: (value: number) => string;
  suffix?: string;
  className?: string;
}

/**
 * Đếm từ 0 tới `target` một lần khi cuộn tới. Giá trị cuối luôn có trong HTML
 * (sr-only + SSR); phần đếm là aria-hidden để trình đọc màn hình không đọc từng số.
 */
export function AnimatedCounterOnScroll({
  target,
  duration = 1400,
  format = (v) => v.toLocaleString("vi-VN"),
  suffix = "",
  className,
}: AnimatedCounterOnScrollProps) {
  const { ref, phase } = useRevealPhase<HTMLSpanElement>(0.5);
  const [value, setValue] = useState(target);
  const final = `${format(target)}${suffix}`;

  useEffect(() => {
    if (phase === "armed") {
      setValue(0);
      return;
    }
    if (phase !== "playing") return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(easeOutCubic(progress) * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, target, duration]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{final}</span>
      <span aria-hidden>{`${format(value)}${suffix}`}</span>
    </span>
  );
}
