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
 * Banner carousel dạng panel nhẹ: nền primary-50, chữ slate-900, một nút secondary.
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
    "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-xs transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:flex dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-900";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Thông báo nổi bật"
      className="relative select-none rounded-3xl bg-primary-50 ring-1 ring-inset ring-primary-100 dark:bg-slate-900 dark:ring-slate-800"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div
        className="overflow-hidden rounded-3xl"
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
                className="flex h-40 w-full flex-shrink-0 items-center justify-between gap-6 px-4 md:h-[200px] md:px-14 lg:h-[220px]"
              >
                <div className="max-w-lg">
                  <h2 className="text-h3 text-slate-900 dark:text-slate-50">{banner.title}</h2>
                  <p className="text-body-sm mt-1 line-clamp-2 text-slate-600 dark:text-slate-300 md:text-base">
                    {banner.subtitle}
                  </p>
                  <Link
                    href={banner.href}
                    // Kéo/vuốt không được coi là bấm nhầm CTA.
                    draggable={false}
                    tabIndex={i === current ? 0 : -1}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "sm" }),
                      // Panel đã là primary-50 nên nút secondary cần nền trắng để nhìn thấy được.
                      "mt-3 border border-primary-100 bg-white shadow-xs hover:bg-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-primary-300 dark:hover:bg-slate-700 md:mt-4"
                    )}
                  >
                    {banner.cta}
                  </Link>
                </div>
                <div
                  aria-hidden="true"
                  className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white text-primary-600 shadow-card md:flex dark:bg-slate-800 dark:text-primary-400"
                >
                  <Icon className="h-10 w-10" strokeWidth={1.75} />
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
            className="group flex h-11 w-6 items-center justify-center focus-visible:outline-none"
          >
            <span
              className={cn(
                "h-1.5 rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2",
                i === current
                  ? "w-1.5 bg-primary-600 dark:bg-primary-400"
                  : "w-1.5 bg-slate-300 group-hover:bg-slate-400 dark:bg-slate-600"
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
