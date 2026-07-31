"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, BookOpen, MessageSquare, Calendar, Award, Users, Sparkles,
  Trophy, Coins, UsersRound, ChevronLeft, ChevronRight, UserPlus, GraduationCap,
  CalendarCheck, ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useSidebarStore } from "@/stores/sidebar.store";
import { getRoleHomeRoute, normalizeRole } from "@/lib/routes";

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, activeRole } = useAuthStore();
  const { isExpanded, toggleExpanded } = useSidebarStore();
  const normalizedRole = normalizeRole(activeRole);
  const isStudent = normalizedRole === "STUDENT";
  const isParent = normalizedRole === "PARENT";
  const homeHref = isAuthenticated ? getRoleHomeRoute(normalizedRole) : "/";

  // Public items - visible to everyone
  const publicItems = [
    { label: "Trang chủ", href: homeHref, icon: Home },
    { label: "Khám phá", href: "/courses", icon: BookOpen },
    { label: "Cuộc thi", href: "/contests", icon: Trophy },
  ];

  // Authenticated-only items
  const authItems = isAuthenticated
    ? [
        ...(isStudent ? [{ label: "Khóa học của tôi", href: "/my-courses", icon: GraduationCap }] : []),
        ...(isStudent ? [{ label: "Lịch học", href: "/schedule", icon: Calendar }] : []),
        ...(isStudent ? [{ label: "Chuyên cần", href: "/my-attendance", icon: CalendarCheck }] : []),
        ...(isStudent ? [{ label: "Chứng chỉ", href: "/certificates", icon: ScrollText }] : []),
        { label: "Bạn bè", href: "/friends", icon: UserPlus },
        { label: "Tin nhắn", href: "/messages", icon: MessageSquare },
        { label: "Nhóm", href: "/groups", icon: UsersRound },
        { label: "Xu", href: "/coins", icon: Coins },
        ...(isStudent ? [{ label: "AI Chat", href: "/ai-chat", icon: Sparkles }] : []),
        ...(isStudent || isParent ? [{ label: "Gia đình", href: "/settings/family", icon: Users }] : []),
        ...(isStudent
          ? [{ label: "Thành tích", href: "/achievements", icon: Award }]
          : []),
      ]
    : [];

  const navItems = [...publicItems, ...authItems];

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
        onClick={toggleExpanded}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 -right-3 z-50",
          "w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm",
          "flex items-center justify-center",
          "hover:bg-gray-50 hover:shadow transition-all",
          "text-gray-400 hover:text-gray-600",
        )}
        title={isExpanded ? "Thu gọn" : "Mở rộng"}
      >
        {isExpanded ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>

    </aside>
  );
}
