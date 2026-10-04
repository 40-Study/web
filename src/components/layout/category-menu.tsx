"use client";

/**
 * CategoryMenu — dropdown/popover liệt kê danh mục khóa học.
 *
 * Nguồn dữ liệu: `useCategories` (src/hooks/use-courses.ts) — cùng hook mà các
 * pill lọc danh mục ở trang /courses đang dùng; không gọi API mới.
 *
 * Hành vi: mở/đóng bằng nút, đóng bằng Esc + click ngoài; aria-expanded,
 * aria-haspopup; focus ring trên nút. Mỗi mục là một link điều hướng tới
 * /courses?category=<slug>; có mục "Tất cả khóa học" ở cuối.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGrid, BookOpen, LayoutList, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/use-courses";
import type { Category } from "@/types/course";

/** Đếm số mục trong lưới 2 cột để tô màu xen kẽ nhẹ theo chỉ số (đa dạng thị giác, không phải dữ liệu). */
const TILE_TONES = [
  "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
  "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
];

function toneFor(index: number) {
  return TILE_TONES[index % TILE_TONES.length];
}

function CategoryTile({
  category,
  index,
  onNavigate,
}: {
  category: Category;
  index: number;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={`/courses?category=${encodeURIComponent(category.slug)}`}
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
          toneFor(index)
        )}
        aria-hidden="true"
      >
        {category.icon ? (
          // eslint-disable-next-line @next/next/no-img-element -- icon_url là icon nhỏ do backend quản lý, không cần optimizer
          <img src={category.icon} alt="" className="w-5 h-5 object-contain" />
        ) : (
          <BookOpen className="w-4.5 h-4.5" />
        )}
      </span>
      <span className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{category.name}</span>
    </Link>
  );
}

export function CategoryMenu({ onAfterNavigate }: { onAfterNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: categories = [], isLoading } = useCategories();

  // Đóng bằng Esc + click ngoài
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Danh mục khóa học"
        className={cn(
          "flex items-center gap-1.5 h-8 px-3 rounded-full text-sm font-medium transition-colors",
          "bg-primary-50 text-primary-700 hover:bg-primary-100",
          "dark:bg-primary-900/40 dark:text-primary-300 dark:hover:bg-primary-900/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        )}
      >
        <LayoutGrid className="w-4 h-4" aria-hidden="true" />
        Danh mục
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Danh mục khóa học"
          className="absolute left-0 top-full mt-2 w-[26rem] bg-popover rounded-2xl shadow-raised border border-border z-50 p-2"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Đang tải danh mục…
            </div>
          ) : categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có danh mục nào</p>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {categories.map((cat, i) => (
                <CategoryTile key={cat.id} category={cat} index={i} onNavigate={close} />
              ))}
            </div>
          )}

          <div className="mt-2 border-t border-border pt-2">
            <Link
              href="/courses"
              onClick={() => {
                close();
                onAfterNavigate?.();
              }}
              className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground"
                aria-hidden="true"
              >
                <LayoutList className="w-4.5 h-4.5" />
              </span>
              <span className="text-sm font-semibold text-foreground">Tất cả khóa học</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
