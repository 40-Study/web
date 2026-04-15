"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, BookOpen, MessageSquare, Calendar, Award, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { getRoleHomeRoute, normalizeRole } from "@/lib/routes";
import { AchievementModal } from "@/components/student/achievement-modal";

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, activeRole } = useAuthStore();
  const normalizedRole = normalizeRole(activeRole);
  const isStudent = normalizedRole === "STUDENT";
  const homeHref = isAuthenticated ? getRoleHomeRoute(normalizedRole) : "/";
  const [achievementModalOpen, setAchievementModalOpen] = useState(false);

  const isParent = normalizedRole === "PARENT";

  const navItems = [
    {
      label: "TRANG CHỦ",
      href: homeHref,
      icon: Home,
    },
    ...(isStudent ? [{ label: "LỊCH HỌC", href: "/schedule", icon: Calendar }] : []),
    { label: "KHÓA HỌC", href: "/courses", icon: BookOpen },
    { label: "THẢO LUẬN", href: "/discussions", icon: MessageSquare },
    ...(isStudent ? [{ label: "AI CHAT", href: "/ai-chat", icon: Sparkles }] : []),
    ...(isStudent || isParent
      ? [{ label: "GIA ĐÌNH", href: "/settings/family", icon: Users }]
      : []),
    ...(isStudent
      ? [
          {
            label: "THÀNH TÍCH",
            href: "#",
            icon: Award,
            onClick: () => setAchievementModalOpen(true),
          },
        ]
      : []),
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-20 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-40 hidden lg:flex flex-col items-center py-6">
      <nav className="flex flex-col items-center gap-3 w-full px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return "onClick" in item ? (
            <button
              key={item.label}
              onClick={item.onClick}
              title={item.label}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-colors text-center w-full",
                "hover:bg-gray-50"
              )}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gray-100">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-[10px] font-medium leading-tight text-gray-600">
                {item.label}
              </span>
            </button>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-colors text-center w-full",
                "hover:bg-gray-50",
                isActive && "bg-primary-50 text-primary-600"
              )}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center",
                  isActive ? "bg-primary-100" : "bg-gray-100"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary-600" : "text-gray-600")} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight",
                  isActive ? "text-primary-600" : "text-gray-600"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <AchievementModal open={achievementModalOpen} onOpenChange={setAchievementModalOpen} />
    </aside>
  );
}