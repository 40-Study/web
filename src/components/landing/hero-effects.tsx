"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Pause, Play } from "lucide-react";
import { FloatingDecorativeShapes } from "@/components/landing/floating-decorative-shapes";

// Canvas chỉ chạy ở client và không chặn paint của chữ hero.
const ParticleWaveBackground = dynamic(
  () =>
    import("@/components/landing/particle-wave-background").then((m) => m.ParticleWaveBackground),
  { ssr: false }
);

// Làm mờ vùng giữa (chữ + CTA) để particle không cạnh tranh với headline.
const TEXT_ZONE_MASK =
  "radial-gradient(ellipse 48% 46% at 50% 46%, rgba(0,0,0,0.12), rgba(0,0,0,1) 88%)";

/**
 * Lớp hiệu ứng nền của hero: particle wave + hình trôi. Đặt trong section `relative`.
 * Nút tạm dừng thỏa WCAG 2.2.2 (chuyển động tự chạy > 5 giây).
 */
export function HeroEffects() {
  const [paused, setPaused] = useState(false);
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ maskImage: TEXT_ZONE_MASK, WebkitMaskImage: TEXT_ZONE_MASK }}
      >
        <ParticleWaveBackground paused={paused} className="absolute inset-0 h-full w-full" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <FloatingDecorativeShapes paused={paused} />
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? "Bật lại hiệu ứng nền" : "Tạm dừng hiệu ứng nền"}
        className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-pill border border-slate-200 bg-white/80 text-slate-600 backdrop-blur transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-slate-50"
      >
        {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
      </button>
    </>
  );
}
