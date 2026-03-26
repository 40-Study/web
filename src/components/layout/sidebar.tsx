"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, MessageSquare, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { getRoleHomeRoute, normalizeRole } from "@/lib/routes";

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, activeRole } = useAuthStore();
  const normalizedRole = normalizeRole(activeRole);
  const isStudent = normalizedRole === "STUDENT";
  const homeHref = isAuthenticated ? getRoleHomeRoute(normalizedRole) : "/";

  const navItems = [
    {
      label: "TRANG CHỦ",
      href: homeHref,
      icon: Home,
    },
    ...(isStudent ? [{ label: "LỊCH HỌC", href: "/schedule", icon: Calendar }] : []),
    { label: "KHÓA HỌC", href: "/courses", icon: BookOpen },
    { label: "THẢO LUẬN", href: "/discussions", icon: MessageSquare },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-20 bg-white border-r border-slate-200 z-40 hidden lg:flex flex-col items-center py-8">
      <nav className="flex flex-col items-center gap-6 w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors text-center",
                "hover:bg-gray-100",
                isActive && "bg-primary-50 text-primary-600"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
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
    </aside>
  );
}
