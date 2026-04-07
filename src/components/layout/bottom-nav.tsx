"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Trophy,
  User,
  Calendar,
  BarChart3,
  Users,
  Wallet,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

type UserRole = "student" | "teacher" | "parent";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const navConfigs: Record<UserRole, NavItem[]> = {
  student: [
    { icon: <Home className="w-5 h-5" />, label: "Home", href: "/home" },
    { icon: <Calendar className="w-5 h-5" />, label: "Lịch học", href: "/schedule" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Courses", href: "/courses" },
    { icon: <Trophy className="w-5 h-5" />, label: "Leaderboard", href: "/leaderboard" },
    { icon: <User className="w-5 h-5" />, label: "Profile", href: "/profile" },
  ],
  teacher: [
    { icon: <Calendar className="w-5 h-5" />, label: "Lịch", href: "/teacher/schedule" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Khóa học", href: "/teacher/courses" },
    { icon: <Users className="w-5 h-5" />, label: "Học sinh", href: "/teacher/students" },
    { icon: <BarChart3 className="w-5 h-5" />, label: "Thống kê", href: "/teacher/analytics" },
    { icon: <Wallet className="w-5 h-5" />, label: "Ví", href: "/teacher/wallet" },
  ],
  parent: [
    { icon: <Home className="w-5 h-5" />, label: "Home", href: "/home" },
    { icon: <Users className="w-5 h-5" />, label: "Children", href: "/children" },
    { icon: <BarChart3 className="w-5 h-5" />, label: "Reports", href: "/reports" },
    { icon: <User className="w-5 h-5" />, label: "Profile", href: "/profile" },
  ],
};

interface BottomNavProps {
  role?: UserRole;
  className?: string;
}

export function BottomNav({ role = "student", className }: BottomNavProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const profileHref = user?.id ? `/profile/${user.id}` : "/login";
  const tabs = navConfigs[role].map((tab) =>
    tab.href === "/profile" ? { ...tab, href: profileHref } : tab
  );

  return (
    <nav
      className={cn(
        "fixed bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border border-gray-100 dark:border-gray-800 rounded-2xl shadow-lg lg:hidden z-50",
        className
      )}
    >
      <div className="flex justify-around py-2 safe-area-bottom">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/home" &&
              tab.href !== "/teacher/schedule" &&
              pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 min-w-[64px] rounded-xl transition-colors",
                isActive
                  ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
