"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  /** Gradient classes for background */
  gradient: string;
  /** Accent color for decorative elements */
  accentColor: string;
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
    gradient: "from-violet-600 via-primary-600 to-indigo-700",
    accentColor: "bg-white/20",
    cta: "Xem cuộc thi",
    href: "/contests",
  },
  {
    id: "certificate",
    title: "Chứng chỉ hoàn thành",
    subtitle: "Hoàn thành khóa học để nhận chứng chỉ, tra cứu công khai bằng mã",
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    accentColor: "bg-white/15",
    cta: "Tra cứu chứng chỉ",
    href: "/certificates/verify",
  },
  {
    id: "help",
    title: "Cần hỗ trợ khi học?",
    subtitle: "Câu hỏi thường gặp và cách liên hệ đội hỗ trợ",
    gradient: "from-pink-600 via-rose-500 to-orange-500",
    accentColor: "bg-white/15",
    cta: "Mở trang trợ giúp",
    href: "/help",
  },
];

/** Auto-advance interval in ms */
const AUTO_PLAY_MS = 5000;

/**
 * Swipeable banner carousel with auto-play, smooth transitions,
 * and rounded corners. Touch/drag support for mobile.
 */
export function CourseBannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragDeltaX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval>>();

  const total = BANNERS.length;

  const goTo = useCallback((index: number) => {
    setCurrent(((index % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-play
  useEffect(() => {
    autoPlayRef.current = setInterval(next, AUTO_PLAY_MS);
    return () => clearInterval(autoPlayRef.current);
  }, [next]);

  const resetAutoPlay = useCallback(() => {
    clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(next, AUTO_PLAY_MS);
  }, [next]);

  // Touch/mouse drag handlers
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
    if (dragDeltaX.current < -threshold) {
      next();
      resetAutoPlay();
    } else if (dragDeltaX.current > threshold) {
      prev();
      resetAutoPlay();
    }
    dragDeltaX.current = 0;
  };

  return (
    <div className="relative select-none">
      {/* Carousel viewport */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-3xl shadow-lg shadow-slate-200/50"
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
      >
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {BANNERS.map((banner) => (
            <div key={banner.id} className="w-full flex-shrink-0">
              <div
                className={cn(
                  "relative bg-gradient-to-r p-8 md:p-14 min-h-[220px] md:min-h-[280px] flex flex-col justify-center overflow-hidden",
                  banner.gradient
                )}
              >
                {/* Decorative shapes */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className={cn("absolute -top-12 -right-12 w-48 h-48 rounded-full blur-2xl", banner.accentColor)} />
                  <div className={cn("absolute -bottom-8 -left-8 w-36 h-36 rounded-full blur-2xl", banner.accentColor)} />
                  <div className="absolute top-1/3 right-1/4 w-20 h-20 border border-white/10 rounded-xl rotate-12" />
                  <div className="absolute bottom-1/4 right-1/3 w-10 h-10 border border-white/10 rounded-lg -rotate-12" />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-lg">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {banner.title}
                  </h3>
                  <p className="text-white/80 text-sm md:text-base mb-5">
                    {banner.subtitle}
                  </p>
                  <Link
                    href={banner.href}
                    // Kéo/vuốt không được coi là bấm nhầm CTA.
                    draggable={false}
                    className="inline-block px-6 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold rounded-xl border border-white/20 transition-all duration-300 hover:scale-[1.02]"
                  >
                    {banner.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => { prev(); resetAutoPlay(); }}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
        style={{ opacity: 0.7 }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => { next(); resetAutoPlay(); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
        style={{ opacity: 0.7 }}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); resetAutoPlay(); }}
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              i === current
                ? "w-8 bg-primary-600"
                : "w-2 bg-slate-300 hover:bg-slate-400"
            )}
          />
        ))}
      </div>
    </div>
  );
}
