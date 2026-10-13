"use client";

import Link from "next/link";
import { Bell, MessageSquare, ShoppingCart, type LucideIcon } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";

interface QuickLink {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Số hiển thị ở cuối dòng; 0/undefined thì không hiện. */
  count?: number;
  countLabel?: (count: number) => string;
}

interface HeaderQuickLinksProps {
  /** Chỉ học viên mua khoá (cùng điều kiện với CartDropdown ở header desktop). */
  isStudent: boolean;
  unreadCount: number;
  onNavigate: () => void;
}

/**
 * Lối vào giỏ hàng / thông báo / tin nhắn cho màn hình hẹp (QA vòng 2 F-04). Ở < md header ẩn chuông và
 * giỏ hàng, còn bottom-nav chỉ đủ chỗ cho điều hướng chính, nên các mục này nằm trong menu hamburger
 * (và menu tài khoản ở 640–767px), cùng kiểu dòng với `userMenuItems` của header.
 *
 * Số lượng giỏ đọc từ `useCartStore` — CartDropdown (luôn được mount, chỉ ẩn bằng CSS) đã đồng bộ nó từ API,
 * nên không phát thêm request.
 */
export function HeaderQuickLinks({ isStudent, unreadCount, onNavigate }: HeaderQuickLinksProps) {
  const cartCount = useCartStore((s) => s.total_item ?? 0);

  const links: QuickLink[] = [
    ...(isStudent
      ? [
          {
            label: "Giỏ hàng",
            href: "/cart",
            icon: ShoppingCart,
            count: cartCount,
            countLabel: (n: number) => `${n} khoá học trong giỏ`,
          },
        ]
      : []),
    {
      label: "Thông báo",
      href: "/notifications",
      icon: Bell,
      count: unreadCount,
      countLabel: (n) => `${n} thông báo chưa đọc`,
    },
    { label: "Tin nhắn", href: "/messages", icon: MessageSquare },
  ];

  return (
    <>
      {links.map(({ label, href, icon: Icon, count, countLabel }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
          onClick={onNavigate}
        >
          <Icon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm text-foreground">{label}</span>
          {count ? (
            <span
              role="status"
              aria-label={countLabel?.(count)}
              className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center leading-none"
            >
              {count > 99 ? "99+" : count}
            </span>
          ) : null}
        </Link>
      ))}
    </>
  );
}
