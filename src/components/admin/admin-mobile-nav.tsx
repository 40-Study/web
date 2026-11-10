"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminMobileNavProps {
  items: { label: string; href: string }[];
  isActive: (href: string) => boolean;
}

/**
 * Menu admin trên mobile: một dải chip cuộn ngang (QA-C-23). Trước đây 17+ mục nằm trên một dải mà không có dấu
 * hiệu còn mục bên phải. Nay mép nào còn nội dung thì có lớp mờ dần (+ mũi tên ở mép phải), và mục đang mở được
 * cuộn vào tầm nhìn khi đổi trang để người dùng thấy mình đang ở đâu.
 */
export function AdminMobileNav({ items, isActive }: AdminMobileNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // 1px dung sai: trình duyệt làm tròn scrollLeft khi zoom.
    setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 });
  }, []);

  const activeHref = items.find((i) => isActive(i.href))?.href;
  useEffect(() => {
    const el = scrollRef.current;
    const active = el?.querySelector<HTMLElement>('[aria-current="page"]');
    // jsdom không có scrollIntoView; trình duyệt thật thì có.
    active?.scrollIntoView?.({ block: "nearest", inline: "center" });
    update();
  }, [activeHref, update]);

  useEffect(() => {
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  return (
    <div className="relative border-t border-border md:hidden">
      <nav ref={scrollRef} onScroll={update} className="flex gap-2 overflow-x-auto px-4 py-2" aria-label="Mục quản trị">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium",
              isActive(item.href)
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                : "bg-muted text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {edges.left && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent" />
      )}
      {edges.right && (
        <div
          aria-hidden="true"
          data-testid="admin-nav-more-right"
          className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l from-card via-card/80 to-transparent pr-1"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
