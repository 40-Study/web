import { cn } from "@/lib/utils";

interface Shape {
  className: string;
  /** Thời lượng và delay của keyframe `float` (tailwind.config). */
  duration: string;
  delay: string;
}

const SHAPES: Shape[] = [
  { className: "left-[6%] top-[16%] h-8 w-8 rotate-12 rounded-lg border-2 border-primary-300/50 dark:border-primary-400/30", duration: "8s", delay: "0s" },
  { className: "right-[5%] top-[38%] h-6 w-6 -rotate-12 rounded-md border-2 border-primary-300/50 dark:border-primary-400/30", duration: "10s", delay: "1s" },
  { className: "bottom-[18%] left-[4%] h-10 w-10 rotate-45 rounded-xl border-2 border-primary-300/40 dark:border-primary-400/25", duration: "12s", delay: "2s" },
  { className: "right-[11%] top-[22%] h-3 w-3 rounded-full bg-primary-400/40 dark:bg-primary-400/30", duration: "7s", delay: "0.5s" },
  { className: "left-[9%] top-[58%] h-2 w-2 rounded-full bg-primary-500/35 dark:bg-primary-400/30", duration: "9s", delay: "1.5s" },
  { className: "bottom-[30%] right-[7%] h-4 w-4 rounded-full bg-primary-300/50 dark:bg-primary-400/25", duration: "11s", delay: "3s" },
  { className: "bottom-[10%] right-[14%] h-12 w-12 rotate-[30deg] rounded-2xl border-2 border-primary-200/60 dark:border-primary-400/20", duration: "14s", delay: "2.5s" },
];

/**
 * Hình trang trí trôi nhẹ ở hai mép hero (CSS thuần, chỉ transform).
 * Ẩn dưới md để không chồng lên chữ; reduced-motion hoặc `paused` thì đứng yên.
 */
export function FloatingDecorativeShapes({ paused = false }: { paused?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
      {SHAPES.map(({ className, duration, delay }) => (
        <div
          key={className}
          className={cn(
            "absolute motion-reduce:!animate-none",
            className,
            paused && "![animation-play-state:paused]"
          )}
          style={{ animation: `float ${duration} ease-in-out ${delay} infinite` }}
        />
      ))}
    </div>
  );
}
