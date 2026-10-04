"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home, BookOpen, MessageSquare, Calendar, Award, Users,
  Trophy, Coins, UsersRound, ChevronLeft, ChevronRight, GraduationCap,
  CalendarCheck, ScrollText, UserCheck, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FriendsNavBadge } from "@/components/friends/friends-nav-badge";
import { useAuthStore } from "@/stores/auth.store";
import { canUseFriends } from "@/components/friends/friends-access";
import { useSidebarStore } from "@/stores/sidebar.store";
import { TEACHER_MENU_ITEMS } from "./teacher-menu";
import { canAccessStudentOnlyRoute, getRoleHomeRoute, normalizeRole, resolveNavRole, ROLE_SCOPED_ROUTES, type NavRole } from "@/lib/routes";

type SidebarRole = NavRole;

interface SidebarNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Vai trò được thấy mục này — thiếu role hiện tại (kể cả GUEST) => ẩn. */
  roles: SidebarRole[];
  /** Chấm số đặt góc trên phải icon (vd. lời mời kết bạn chờ). */
  badge?: React.ReactNode;
}

/**
 * Route tĩnh có mặt trong `ROLE_SCOPED_ROUTES` (`lib/routes.ts`) => menu LẤY
 * NGUYÊN `roles` từ đó, không khai báo lại — nguồn của lỗi review MAJOR #1:
 * menu ẩn mục nhưng route guard đọc một danh sách role khác nên gõ thẳng URL
 * vẫn vào được. Route không nằm trong bảng (vd "Trang chủ"/"Khám phá", href
 * động hoặc không hạn chế theo role) thì giữ mảng roles khai báo tại chỗ.
 */
function rolesFromRouteTable(href: string): SidebarRole[] {
  const entry = ROLE_SCOPED_ROUTES.find((r) => r.href === href);
  if (!entry) {
    throw new Error(
      `sidebar.tsx: route "${href}" không có entry trong ROLE_SCOPED_ROUTES (lib/routes.ts) — ` +
        `thêm vào đó trước, đừng khai báo roles rời ở đây (tránh lệch menu/route, review PR #26 MAJOR #1).`
    );
  }
  return entry.roles;
}

/**
 * Menu data-driven theo role (M-19 phụ huynh, S-P1-4 bạn bè, H8 AI Chat) — một
 * mảng duy nhất thay vì if/else rải rác. `roles` là danh sách vai trò được
 * thấy mục đó; không khai báo role hiện tại => tự ẩn, không cần nhánh riêng.
 *
 * - "Bạn bè": chỉ STUDENT (roles lấy từ ROLE_SCOPED_ROUTES) — phụ huynh/giáo viên
 *   không có tính năng này (plans/260930-groups-friends Q1). Kèm badge số lời mời chờ.
 * - "AI Chat": bỏ hẳn khỏi menu mọi vai trò — sản phẩm không làm AI (H8).
 * - Phụ huynh không cần Nhóm/Xu (tính năng game-hoá của học sinh);
 *   "Gia đình" đổi nhãn "Con của tôi" khi xem bằng vai phụ huynh.
 * - "Cuộc thi": phụ huynh THẤY (xem chỉ đọc danh sách + chi tiết, contract
 *   cuộc thi §7) — roles lấy từ ROLE_SCOPED_ROUTES nên menu tự khớp route guard.
 * - ADMIN (A-P2-4): không có item nào khai báo role này -> sidebar rỗng khi
 *   admin ghé các trang tài khoản cá nhân được phép
 *   (`(app)/layout.tsx` § ADMIN_ALLOWED_EXACT_ROUTES) — không lộ menu học
 *   sinh/game-hoá; điều hướng admin thật nằm ở `(admin)/layout.tsx`.
 * - Mọi item có href tĩnh trùng `ROLE_SCOPED_ROUTES` LẤY roles từ đó (xem
 *   `rolesFromRouteTable`) — một nguồn duy nhất với route guard ở
 *   `(app)/layout.tsx` (review PR #26 MAJOR #1).
 */
function buildSidebarItems(homeHref: string, familyLabel: string): SidebarNavItem[] {
  return [
    { label: "Trang chủ", href: homeHref, icon: Home, roles: ["GUEST", "STUDENT", "PARENT"] },
    { label: "Khám phá", href: "/courses", icon: BookOpen, roles: ["GUEST", "STUDENT", "PARENT"] },
    { label: "Cuộc thi", href: "/contests", icon: Trophy, roles: rolesFromRouteTable("/contests") },
    { label: "Khóa học của tôi", href: "/my-courses", icon: GraduationCap, roles: rolesFromRouteTable("/my-courses") },
    { label: "Lịch học", href: "/schedule", icon: Calendar, roles: rolesFromRouteTable("/schedule") },
    // A-08: đường vào danh sách buổi livestream; A-07: sổ điểm của học viên. Roles lấy từ ROLE_SCOPED_ROUTES như
    // mọi mục khác nên menu và route guard không lệch nhau.
    { label: "Livestream", href: "/livestream", icon: Radio, roles: rolesFromRouteTable("/livestream") },
    { label: "Điểm của tôi", href: "/my-grades", icon: Award, roles: rolesFromRouteTable("/my-grades") },
    { label: "Chuyên cần", href: "/my-attendance", icon: CalendarCheck, roles: rolesFromRouteTable("/my-attendance") },
    { label: "Chứng chỉ", href: "/certificates", icon: ScrollText, roles: rolesFromRouteTable("/certificates") },
    { label: "Tin nhắn", href: "/messages", icon: MessageSquare, roles: rolesFromRouteTable("/messages") },
    { label: "Nhóm", href: "/groups", icon: UsersRound, roles: rolesFromRouteTable("/groups") },
    { label: "Bạn bè", href: "/friends", icon: UserCheck, roles: rolesFromRouteTable("/friends"), badge: <FriendsNavBadge /> },
    { label: "Xu", href: "/coins", icon: Coins, roles: rolesFromRouteTable("/coins") },
    { label: familyLabel, href: "/settings/family", icon: Users, roles: rolesFromRouteTable("/settings/family") },
    { label: "Thành tích", href: "/achievements", icon: Award, roles: rolesFromRouteTable("/achievements") },
  ];
}

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, activeRole } = useAuthStore();
  const { isCollapsed, toggle } = useSidebarStore();
  const isExpanded = !isCollapsed; // sidebar.store.ts dùng chung 1 API isCollapsed (mục 14)
  const normalizedRole = normalizeRole(activeRole);
  const isParent = normalizedRole === "PARENT";
  const homeHref = isAuthenticated ? getRoleHomeRoute(normalizedRole) : "/";

  const currentRole: SidebarRole = resolveNavRole(isAuthenticated, normalizedRole);
  const familyLabel = isParent ? "Con của tôi" : "Gia đình";
  // B-11: giảng viên ghé trang dùng chung (/messages, /notifications, /settings...) phải thấy menu GIẢNG VIÊN,
  // không phải menu học viên — nếu không họ mất đường quay về khu /teacher. resolveNavRole quy TEACHER về STUDENT
  // chỉ để dựng khung; menu chọn theo vai THẬT.
  const navItems: SidebarNavItem[] =
    normalizedRole === "TEACHER"
      ? TEACHER_MENU_ITEMS.map((item) => ({ ...item, roles: [currentRole] }))
      : buildSidebarItems(homeHref, familyLabel).filter((item) =>
          item.roles.includes(currentRole) &&
          (item.href !== "/friends" || canUseFriends(activeRole)) &&
          // Mục học viên-only khoá theo vai THẬT (cùng hàm với route guard).
          canAccessStudentOnlyRoute(item.href, activeRole)
        );

  return (
    <aside className={cn(
      "fixed left-0 top-16 bottom-0 bg-card border-r border-border z-40 hidden lg:flex flex-col transition-all duration-200 motion-reduce:transition-none",
      isExpanded ? "w-48" : "w-[60px]",
    )}>
      {/* Nav items */}
      <nav aria-label="Điều hướng chính" className="flex-1 flex flex-col gap-1 px-2 py-3 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = item.href !== "#" && (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          const isAction = "onClick" in item;

          const inner = (
            <div className={cn(
              "flex items-center gap-3 h-10 px-3 rounded-lg transition-colors w-full",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              !isExpanded && "justify-center px-0",
              isActive
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}>
              <span className="relative shrink-0">
                <Icon className="w-5 h-5" aria-hidden="true" />
                {item.badge}
              </span>
              {isExpanded && (
                <span className="text-sm font-medium truncate">
                  {item.label}
                </span>
              )}
            </div>
          );

          return isAction ? (
            <button key={item.label} onClick={(item as any).onClick} title={item.label}>{inner}</button>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={isExpanded ? undefined : item.label}
              aria-current={isActive ? "page" : undefined}
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {inner}
            </Link>
          );
        })}
      </nav>

      {/* Toggle button - centered vertically on the right edge */}
      <button
        onClick={toggle}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 -right-3 z-50",
          "w-6 h-6 rounded-full bg-card border border-border shadow-xs",
          "flex items-center justify-center",
          "hover:bg-muted transition-colors",
          "text-muted-foreground hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        )}
        title={isExpanded ? "Thu gọn" : "Mở rộng"}
        aria-label={isExpanded ? "Thu gọn menu" : "Mở rộng menu"}
      >
        {isExpanded ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>

    </aside>
  );
}
