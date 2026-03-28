"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Animation delay in ms */
  delay?: number;
  /** slide-up (default), slide-left, slide-right, fade, scale */
  direction?: "up" | "left" | "right" | "fade" | "scale";
  /** IntersectionObserver threshold (0-1) */
  threshold?: number;
}

const directionStyles = {
  up: { hidden: "translate-y-8 opacity-0", visible: "translate-y-0 opacity-100" },
  left: { hidden: "-translate-x-8 opacity-0", visible: "translate-x-0 opacity-100" },
  right: { hidden: "translate-x-8 opacity-0", visible: "translate-x-0 opacity-100" },
  fade: { hidden: "opacity-0", visible: "opacity-100" },
  scale: { hidden: "scale-95 opacity-0", visible: "scale-100 opacity-100" },
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  threshold = 0.15,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

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

  const styles = directionStyles[direction];

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? styles.visible : styles.hidden,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
