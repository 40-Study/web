"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Độ trễ (ms) — dùng để stagger 60ms giữa các phần tử cùng nhóm. */
  delay?: number;
  /**
   * Giữ lại cho tương thích với nơi gọi cũ (/courses, discussions).
   * Mọi hướng đều là fade + trượt lên 12px; riêng "fade" chỉ fade.
   */
  direction?: "up" | "left" | "right" | "fade" | "scale";
  /** Ngưỡng IntersectionObserver (0-1). */
  threshold?: number;
}

/**
 * Fade + translate-y 12px, 400ms, chạy một lần.
 *
 * Không pre-hide khi tắt JS: HTML server-render luôn ở trạng thái HIỂN THỊ.
 * Chỉ sau khi effect chạy (tức JS đã hoạt động) và chắc chắn có observer theo
 * dõi, phần tử mới được ẩn để chờ cuộn tới. Người dùng bật reduced-motion hoặc
 * trình duyệt không có IntersectionObserver luôn thấy nội dung ngay.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  threshold = 0.15,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    // Phần tử đã nằm trong viewport lúc mount: không ẩn rồi hiện lại (tránh
    // nháy nội dung above-the-fold).
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true);
      return;
    }

    setIsVisible(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const hidden = direction === "fade" ? "opacity-0" : "translate-y-3 opacity-0";
  const visible = direction === "fade" ? "opacity-100" : "translate-y-0 opacity-100";

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-[400ms] ease-out motion-reduce:transition-none",
        isVisible ? visible : hidden,
        className
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
