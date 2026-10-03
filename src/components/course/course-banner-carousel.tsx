"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Award, ChevronLeft, ChevronRight, LifeBuoy, Trophy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Call-to-action text */
  cta: string;
  href: string;
}

// Mỗi banner CHỈ hứa những gì có thật và trỏ tới route công khai đang tồn tại (F4, QA vòng 2).
// Bản cũ dùng 3 slug khoá học không có trong dữ liệu (web-fullstack, ui-ux-figma,
// python-data-science → 404), một banner "Flash Sale giảm 50%" trong khi hệ thống không có cơ chế
// đó, và nút CTA là <button> không có href/onClick nên bấm không làm gì.
export const BANNERS: BannerSlide[] = [
  {
    id: "contests",
    title: "Cuộc thi học tập",
    subtitle: "Thử sức với các cuộc thi và xem bảng xếp hạng",
    icon: Trophy,
    cta: "Xem cuộc thi",
    href: "/contests",
  },
  {
    id: "certificate",
    title: "Chứng chỉ hoàn thành",
    subtitle: "Hoàn thành khóa học để nhận chứng chỉ, tra cứu công khai bằng mã",
    icon: Award,
    cta: "Tra cứu chứng chỉ",
    href: "/certificates/verify",
  },
  {
    id: "help",
    title: "Cần hỗ trợ khi học?",
    subtitle: "Câu hỏi thường gặp và cách liên hệ đội hỗ trợ",
    icon: LifeBuoy,
    cta: "Mở trang trợ giúp",
    href: "/help",
  },
];

/** Tự chuyển slide tối đa 1 lần / 6 giây; dừng khi hover, focus hoặc reduced-motion. */
const AUTO_PLAY_MS = 6000;

/**
 * Banner carousel kiểu F8: nền gradient xanh thương hiệu, chữ trắng, nút pill viền trắng.
 * Hỗ trợ vuốt/kéo trên mobile, mũi tên từ md trở lên, dot 6px.
 */
export function CourseBannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dragStartX = useRef(0);
  const dragDeltaX = useRef(0);

  const total = BANNERS.length;

  const goTo = useCallback(
    (index: number) => setCurrent(((index % total) + total) % total),
    [total]
  );
  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Mỗi lần đổi slide (kể cả thủ công) đồng hồ được đặt lại từ đầu.
  useEffect(() => {
    if (isPaused || reducedMotion || isDragging) return;
    const timer = setTimeout(next, AUTO_PLAY_MS);
    return () => clearTimeout(timer);
  }, [current, isPaused, reducedMotion, isDragging, next]);

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    dragStartX.current = clientX;
    dragDeltaX.current = 0;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    dragDeltaX.current = clientX - dragStartX.current;
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 50;
    if (dragDeltaX.current < -threshold) next();
    else if (dragDeltaX.current > threshold) prev();
    dragDeltaX.current = 0;
  };

  const arrowClass =
    "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/90 text-slate-700 shadow-xs transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:flex dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-900";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Thông báo nổi bật"
      className="relative select-none rounded-[20px] bg-gradient-to-r from-primary-800 via-primary-700 to-primary-500 shadow-card dark:from-primary-950 dark:via-primary-900 dark:to-primary-700"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div
        className="overflow-hidden rounded-[20px]"
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {BANNERS.map((banner, i) => {
            const Icon = banner.icon;
            return (
              <div
                key={banner.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${total}`}
                className="flex h-[240px] w-full flex-shrink-0 items-center justify-between gap-6 px-6 md:h-[280px] md:px-16 lg:h-[320px] lg:px-20"
              >
                <div className="max-w-2xl">
                  <h2 className="font-heading text-3xl font-extrabold leading-tight text-white md:text-4xl lg:text-[2.75rem]">
                    {banner.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-base leading-relaxed text-white/90 lg:text-lg">
                    {banner.subtitle}
                  </p>
                  <Link
                    href={banner.href}
                    // Kéo/vuốt không được coi là bấm nhầm CTA.
                    draggable={false}
                    tabIndex={i === current ? 0 : -1}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "lg" }),
                      // Nút pill viền trắng trên nền gradient; hover đảo thành nền trắng.
                      "mt-5 min-h-11 rounded-full border-2 border-white bg-transparent px-7 font-semibold text-white shadow-none hover:bg-white hover:text-primary-700 focus-visible:ring-white md:mt-6"
                    )}
                  >
                    {banner.cta}
                  </Link>
                </div>
                <div
                  aria-hidden="true"
                  className="hidden h-40 w-40 shrink-0 items-center justify-center rounded-[2rem] bg-white/15 text-white ring-1 ring-inset ring-white/30 backdrop-blur-sm md:flex lg:h-52 lg:w-52"
                >
                  <Icon className="h-20 w-20 lg:h-28 lg:w-28" strokeWidth={1.5} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        aria-label="Slide trước"
        onClick={prev}
        className={cn(arrowClass, "left-3")}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Slide sau"
        onClick={next}
        className={cn(arrowClass, "right-3")}
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Dots: chấm 6px, vùng bấm lớn hơn để đủ touch target */}
      <div className="absolute bottom-0 right-2 flex md:right-1/2 md:translate-x-1/2">
        {BANNERS.map((banner, i) => (
          <button
            key={banner.id}
            type="button"
            aria-label={`Chuyển tới slide ${i + 1}`}
            aria-current={i === current}
            onClick={() => goTo(i)}
            className="group grid size-6 place-items-center focus-visible:outline-none"
          >
            <span
              className={cn(
                "h-1.5 rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-white group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-primary-700",
                i === current
                  ? "w-1.5 bg-white"
                  : "w-1.5 bg-white/40 group-hover:bg-white/70"
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
