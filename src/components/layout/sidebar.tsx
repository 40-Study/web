"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home, BookOpen, MessageSquare, Calendar, Award, Users,
  Trophy, Coins, UsersRound, ChevronLeft, ChevronRight, GraduationCap,
  CalendarCheck, ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useSidebarStore } from "@/stores/sidebar.store";
import { getRoleHomeRoute, normalizeRole } from "@/lib/routes";

type SidebarRole = "GUEST" | "STUDENT" | "PARENT" | "ADMIN";

interface SidebarNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Vai trò được thấy mục này — thiếu role hiện tại (kể cả GUEST) => ẩn. */
  roles: SidebarRole[];
}

/**
 * Menu data-driven theo role (M-19 phụ huynh, S-P1-4 bạn bè, H8 AI Chat) — một
 * mảng duy nhất thay vì if/else rải rác. `roles` là danh sách vai trò được
 * thấy mục đó; không khai báo role hiện tại => tự ẩn, không cần nhánh riêng.
 *
 * - "Bạn bè": bỏ hẳn khỏi menu mọi vai trò — backend chưa có API bạn bè
 *   (S-P1-4), trang chỉ còn thông báo "Sắp có".
 * - "AI Chat": bỏ hẳn khỏi menu mọi vai trò — sản phẩm không làm AI (H8).
 * - Phụ huynh không cần Cuộc thi/Nhóm/Xu (tính năng game-hoá của học sinh);
 *   "Gia đình" đổi nhãn "Con của tôi" khi xem bằng vai phụ huynh.
 * - ADMIN (A-P2-4): không có item nào khai báo role này -> sidebar rỗng khi
 *   admin ghé các trang tài khoản cá nhân được phép
 *   (`(app)/layout.tsx` § ADMIN_ALLOWED_EXACT_ROUTES) — không lộ menu học
 *   sinh/game-hoá; điều hướng admin thật nằm ở `(admin)/layout.tsx`.
 */
function buildSidebarItems(homeHref: string, familyLabel: string): SidebarNavItem[] {
  return [
    { label: "Trang chủ", href: homeHref, icon: Home, roles: ["GUEST", "STUDENT", "PARENT"] },
    { label: "Khám phá", href: "/courses", icon: BookOpen, roles: ["GUEST", "STUDENT", "PARENT"] },
    { label: "Cuộc thi", href: "/contests", icon: Trophy, roles: ["GUEST", "STUDENT"] },
    { label: "Khóa học của tôi", href: "/my-courses", icon: GraduationCap, roles: ["STUDENT"] },
    { label: "Lịch học", href: "/schedule", icon: Calendar, roles: ["STUDENT"] },
    { label: "Chuyên cần", href: "/my-attendance", icon: CalendarCheck, roles: ["STUDENT"] },
    { label: "Chứng chỉ", href: "/certificates", icon: ScrollText, roles: ["STUDENT"] },
    { label: "Tin nhắn", href: "/messages", icon: MessageSquare, roles: ["STUDENT", "PARENT"] },
    { label: "Nhóm", href: "/groups", icon: UsersRound, roles: ["STUDENT"] },
    { label: "Xu", href: "/coins", icon: Coins, roles: ["STUDENT"] },
    { label: familyLabel, href: "/settings/family", icon: Users, roles: ["STUDENT", "PARENT"] },
    { label: "Thành tích", href: "/achievements", icon: Award, roles: ["STUDENT"] },
  ];
}

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, activeRole } = useAuthStore();
  const { isCollapsed, toggle } = useSidebarStore();
  const isExpanded = !isCollapsed; // sidebar.store.ts dùng chung 1 API isCollapsed (mục 14)
  const normalizedRole = normalizeRole(activeRole);
  const isParent = normalizedRole === "PARENT";
  const isAdmin = normalizedRole === "SYSTEM_ADMIN" || normalizedRole === "ORG_OWNER";
  const homeHref = isAuthenticated ? getRoleHomeRoute(normalizedRole) : "/";

  const currentRole: SidebarRole = !isAuthenticated
    ? "GUEST"
    : isAdmin
      ? "ADMIN"
      : isParent
        ? "PARENT"
        : "STUDENT";
  const familyLabel = isParent ? "Con của tôi" : "Gia đình";
  const navItems = buildSidebarItems(homeHref, familyLabel).filter((item) =>
    item.roles.includes(currentRole)
  );

  return (
    <aside className={cn(
      "fixed left-0 top-16 bottom-0 bg-white border-r border-gray-100 z-40 hidden lg:flex flex-col transition-all duration-200",
      isExpanded ? "w-48" : "w-[60px]",
    )}>
      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-0.5 px-1.5 py-3 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = item.href !== "#" && (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          const isAction = "onClick" in item;

          const inner = (
            <div className={cn(
              "flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors w-full",
              "hover:bg-gray-50",
              isActive && "bg-blue-50 text-blue-600",
              !isActive && "text-gray-600",
            )}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                isActive ? "bg-blue-100" : "bg-gray-50",
              )}>
                <Icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-gray-500")} />
              </div>
              {isExpanded && (
                <span className={cn("text-xs font-medium truncate", isActive ? "text-blue-600" : "text-gray-600")}>
                  {item.label}
                </span>
              )}
            </div>
          );

          return isAction ? (
            <button key={item.label} onClick={(item as any).onClick} title={item.label}>{inner}</button>
          ) : (
            <Link key={item.href} href={item.href} title={item.label}>{inner}</Link>
          );
        })}
      </nav>

      {/* Toggle button - centered vertically on the right edge */}
      <button
        onClick={toggle}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 -right-3 z-50",
          "w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm",
          "flex items-center justify-center",
          "hover:bg-gray-50 hover:shadow transition-all",
          "text-gray-400 hover:text-gray-600",
        )}
        title={isExpanded ? "Thu gọn" : "Mở rộng"}
        aria-label={isExpanded ? "Thu gọn menu" : "Mở rộng menu"}
      >
        {isExpanded ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>

    </aside>
  );
}
