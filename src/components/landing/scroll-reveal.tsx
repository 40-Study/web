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
  // Mặc định HIỂN THỊ — chỉ ẩn đi để chờ observer SAU KHI đã xác nhận sẽ có
  // observer thật sự theo dõi. Trước đây mặc định `false` khiến nội dung
  // trắng hoàn toàn cho tới khi cuộn tới, kể cả khi JS chưa kịp chạy, trình
  // duyệt không hỗ trợ IntersectionObserver, hoặc HTML tĩnh được bot/crawler
  // đọc (QA khách P2, 260927).
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion) {
      // Không hỗ trợ / người dùng yêu cầu giảm chuyển động — giữ hiển thị,
      // bỏ hẳn hiệu ứng thay vì có nguy cơ đứng yên ở trạng thái ẩn.
      setIsVisible(true);
      return;
    }

    // Chỉ ẩn đi (chờ cuộn tới) SAU KHI chắc chắn sẽ có observer bắt lại —
    // tránh trường hợp effect không chạy được vì lý do nào đó mà nội dung kẹt
    // ở trạng thái ẩn vĩnh viễn.
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
