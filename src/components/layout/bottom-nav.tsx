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
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { FriendsNavBadge } from "@/components/friends/friends-nav-badge";

type UserRole = "student" | "teacher" | "parent" | "guest" | "admin";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  /** Chấm số đặt góc trên phải icon (vd. lời mời kết bạn chờ). */
  badge?: React.ReactNode;
}

// Nhãn thống nhất tiếng Việt cho mọi vai trò (M-03); /children và /reports trỏ tới
// route thật (/settings/family) hoặc bị bỏ khi chưa có trang tương ứng (H-06).
const navConfigs: Record<UserRole, NavItem[]> = {
  student: [
    { icon: <Home className="w-5 h-5" />, label: "Trang chủ", href: "/home" },
    { icon: <Calendar className="w-5 h-5" />, label: "Lịch học", href: "/schedule" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Khóa học", href: "/courses" },
    { icon: <Trophy className="w-5 h-5" />, label: "Xếp hạng", href: "/leaderboard" },
    // Bạn bè chỉ dành cho học viên (Q1): các vai khác không có mục này.
    { icon: <UserCheck className="w-5 h-5" />, label: "Bạn bè", href: "/friends", badge: <FriendsNavBadge /> },
    { icon: <User className="w-5 h-5" />, label: "Cá nhân", href: "/profile" },
  ],
  teacher: [
    { icon: <Calendar className="w-5 h-5" />, label: "Lịch", href: "/teacher/schedule" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Khóa học", href: "/teacher/courses" },
    { icon: <Users className="w-5 h-5" />, label: "Học sinh", href: "/teacher/students" },
    { icon: <BarChart3 className="w-5 h-5" />, label: "Thống kê", href: "/teacher/analytics" },
    { icon: <Wallet className="w-5 h-5" />, label: "Ví", href: "/teacher/wallet" },
  ],
  parent: [
    { icon: <Home className="w-5 h-5" />, label: "Trang chủ", href: "/home" },
    { icon: <Users className="w-5 h-5" />, label: "Con của tôi", href: "/settings/family" },
    { icon: <User className="w-5 h-5" />, label: "Cá nhân", href: "/profile" },
  ],
  // Khách chưa đăng nhập (QA guest P1): trước đây dùng chung bộ tab "student",
  // 3/5 mục (Trang chủ→/home, Lịch học, Xếp hạng) trỏ route cần đăng nhập nên
  // bấm là bị đá sang /login dù đang đứng ở trang public. Chỉ giữ mục thật sự
  // dùng được khi chưa đăng nhập.
  guest: [
    { icon: <Home className="w-5 h-5" />, label: "Trang chủ", href: "/" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Khóa học", href: "/courses" },
    { icon: <User className="w-5 h-5" />, label: "Đăng nhập", href: "/login" },
  ],
  // A-P2-4: admin chỉ ghé `(app)/**` cho vài trang tài khoản cá nhân
  // (`(app)/layout.tsx` § ADMIN_ALLOWED_EXACT_ROUTES) — không lộ menu học
  // sinh/game-hoá, chỉ để lại lối về hồ sơ của chính họ.
  admin: [
    { icon: <User className="w-5 h-5" />, label: "Cá nhân", href: "/profile" },
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
        "fixed bottom-4 left-4 right-4 bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-raised lg:hidden z-50",
        className
      )}
    >
      <div className="flex justify-around py-2 safe-area-bottom">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/home" &&
              tab.href !== "/teacher/schedule" &&
              tab.href !== "/" && // guest "Trang chủ" -> "/"; startsWith("/") khớp MỌI route
              pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2 min-w-[56px] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive
                  ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="relative">
                {tab.icon}
                {tab.badge}
              </span>
              <span className="whitespace-nowrap text-[11px] font-medium leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
