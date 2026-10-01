"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** useLayoutEffect cảnh báo khi SSR; dùng useEffect ở server. */
export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** Theo dõi `prefers-reduced-motion`; mặc định false khi SSR. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(REDUCED_QUERY);
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * static  — SSR, tắt JS, reduced-motion hoặc không có IntersectionObserver: hiện trạng thái CUỐI.
 * armed   — JS đã chạy, đang chờ cuộn tới: hiện trạng thái ĐẦU của animation.
 * playing — đã vào viewport: chạy animation một lần.
 *
 * Nội dung SSR luôn ở trạng thái cuối; chỉ sau khi mount (trước lần paint đầu tiên của
 * client) mới chuyển sang "armed" nên không bao giờ làm trống nội dung khi JS hỏng.
 */
export type RevealPhase = "static" | "armed" | "playing";

export function useRevealPhase<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [phase, setPhase] = useState<RevealPhase>("static");

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced =
      typeof window.matchMedia === "function" && window.matchMedia(REDUCED_QUERY).matches;
    if (reduced || typeof IntersectionObserver === "undefined") return;

    setPhase("armed");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase("playing");
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, phase };
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
