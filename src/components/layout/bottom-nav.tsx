"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Trophy,
  User,
  PlusCircle,
  BarChart3,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserRole = "student" | "teacher" | "parent";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const navConfigs: Record<UserRole, NavItem[]> = {
  student: [
    { icon: <Home className="w-5 h-5" />, label: "Home", href: "/dashboard" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Courses", href: "/courses" },
    { icon: <Trophy className="w-5 h-5" />, label: "Leaderboard", href: "/leaderboard" },
    { icon: <User className="w-5 h-5" />, label: "Profile", href: "/profile" },
  ],
  teacher: [
    { icon: <Home className="w-5 h-5" />, label: "Home", href: "/dashboard/teacher" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Courses", href: "/courses/manage" },
    { icon: <PlusCircle className="w-5 h-5" />, label: "Create", href: "/courses/new" },
    { icon: <BarChart3 className="w-5 h-5" />, label: "Analytics", href: "/analytics" },
    { icon: <User className="w-5 h-5" />, label: "Profile", href: "/profile" },
  ],
  parent: [
    { icon: <Home className="w-5 h-5" />, label: "Home", href: "/dashboard/parent" },
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
  const tabs = navConfigs[role];

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-50",
        className
      )}
    >
      <div className="flex justify-around py-2 safe-area-bottom">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/dashboard" &&
              tab.href !== "/dashboard/teacher" &&
              tab.href !== "/dashboard/parent" &&
              pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 min-w-[64px] transition-colors",
                isActive
                  ? "text-primary-600 dark:text-primary-400"
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
