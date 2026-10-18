import { cn } from "@/lib/utils";
import type { TeachingSlide } from "@/lib/open-design/project";
export function SlideSheet({
  slide,
  index,
  total,
  compact = false,
}: {
  slide: TeachingSlide;
  index: number;
  total: number;
  compact?: boolean;
}) {
  return (
    <article
      data-layout={slide.layout}
      className={cn(
        "slide-sheet relative w-full border shadow-card",
        compact && "pointer-events-none"
      )}
      aria-label={`Slide ${index + 1}: ${slide.title}`}
    >
      <div className="slide-inner">
        <div className="mb-[2cqw] flex items-center justify-between text-[1.2cqw] font-semibold uppercase tracking-widest opacity-70">
          <span>ForteX · bài giảng</span>
          <span>
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
        <h2 className="slide-title font-heading font-bold">{slide.title}</h2>
        {slide.subtitle && <p className="slide-subtitle mt-[2cqw] opacity-75">{slide.subtitle}</p>}
        <ul className="slide-bullets mt-[3cqw] space-y-[1.2cqw]">
          {slide.bullets.map((bullet, i) => (
            <li key={i} className="slide-bullet flex items-start gap-[1.4cqw]">
              <span className="mt-[0.45cqw] h-[0.7cqw] w-[0.7cqw] shrink-0 rounded-full bg-current opacity-60" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        {slide.layout === "cover" && (
          <div className="mt-[4cqw] h-[0.7cqw] w-[9cqw] rounded-full bg-current opacity-35" />
        )}
      </div>
    </article>
  );
}
