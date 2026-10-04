"use client";

import Link from "next/link";
import { ForteXLogoIcon } from "@/components/landing/fortex-logo-icon";
import { useState, useRef, useEffect } from "react";
import { Bell, FileText, Settings, LogOut, Menu, X, Ticket, ChevronDown, Check, UserCircle, Coins, Users, Receipt, GraduationCap, Presentation, Building2, ShieldCheck, type LucideIcon } from "lucide-react";
import { siteConfig } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { AuthModal } from "@/components/auth/auth-modal";
import { GlobalSearch } from "@/components/layout/global-search";
import { CartDropdown } from "@/components/layout/cart-dropdown";
import { useLogout, useSwitchRole, useMyRoles } from "@/hooks/queries/use-auth";
import { useAuthStore } from "@/stores/auth.store";
import { useCoinWallet } from "@/hooks/queries/use-coins";
import { canUseCoinWallet, getRoleHomeRoute, normalizeRole } from "@/lib/routes";
import { useNotifications, useUnreadCount, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/queries/use-notifications";
import { useNotificationSocket } from "@/hooks/use-notification-socket";

interface MenuItem {
  label: string;
  href: string;
  icon: typeof FileText;
  badge?: boolean;
}

// Role display config — icon lucide (không emoji), một tông màu chung; phân biệt vai trò bằng icon + nhãn
const ROLE_BADGE_CLASS = "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300";
const ROLE_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  STUDENT: { label: "Học sinh", icon: GraduationCap },
  TEACHER: { label: "Giáo viên", icon: Presentation },
  PARENT: { label: "Phụ huynh", icon: Users },
  ORG_OWNER: { label: "Quản lý", icon: Building2 },
  SYSTEM_ADMIN: { label: "Admin", icon: ShieldCheck },
  TEACHER_APPLICANT: { label: "Ứng viên GV", icon: FileText },
};

function getRoleDisplay(roleName: string) {
  return ROLE_CONFIG[roleName] || { label: roleName, icon: UserCircle };
}

// Student-only menu items (shown before common items)
const studentMenuItems: MenuItem[] = [
  { label: "Bài tập", href: "/my-assignments", icon: FileText, badge: true },
  { label: "Voucher của tôi", href: "/my-vouchers", icon: Ticket },
];

// "Đơn hàng của tôi" (lane B vòng 2 đã có trang /orders): chỉ vai học viên/phụ huynh thấy —
// giảng viên không mua khoá, còn admin bị (app)/layout chuyển về /admin nên link sẽ chết.
export const ordersMenuItem: MenuItem = { label: "Đơn hàng của tôi", href: "/orders", icon: Receipt };

// Common menu items for all roles
const commonMenuItems: MenuItem[] = [
  { label: "Cài đặt tài khoản", href: "/settings", icon: Settings },
];

/** Format a UTC timestamp into Vietnamese relative time */
function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: "login" | "register" }>({
    isOpen: false,
    mode: "login",
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, user, activeRole, activeUnifiedRole, roles } = useAuthStore();
  const logoutMutation = useLogout();
  const switchRoleMutation = useSwitchRole();
  const { data: myRolesData } = useMyRoles();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const availableRoles = myRolesData?.roles ?? roles ?? [];

  // Notification hooks — only fetch when authenticated
  const { data: unreadData } = useUnreadCount();
  const { data: notifData } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  // Initialize WebSocket connection for real-time notifications
  useNotificationSocket();

  const { data: coinWallet } = useCoinWallet();
  const coinBalance = isAuthenticated ? (coinWallet?.balance ?? 0) : 0;

  const unreadCount = isAuthenticated ? (unreadData?.unread_count ?? 0) : 0;
  const notifications = isAuthenticated ? (notifData?.notifications ?? []) : [];
  const normalizedRole = normalizeRole(activeRole);
  const isStudent = normalizedRole === "STUDENT";
  const homeHref = isAuthenticated ? getRoleHomeRoute(normalizedRole) : "/";

  const isParent = normalizedRole === "PARENT";
  const canSeeOrders = isStudent || isParent;

  // Phụ huynh không học: /coins và /my-courses chỉ dành cho học viên (ROLE_SCOPED_ROUTES) nên link
  // tới đó sẽ bị chuyển hướng. Nút chính của phụ huynh trỏ về /home — nơi đang hiển thị tổng quan
  // các con (ParentHomeOverview); chưa có route danh sách con riêng nên không bịa thêm.
  // Giảng viên cũng không học: "Khóa học của tôi" kiểu học viên vô nghĩa, dẫn về khu giảng dạy (B-11).
  const primaryNav = isParent
    ? { label: "Con của tôi", href: "/home" }
    : normalizedRole === "TEACHER"
      ? { label: "Khóa học giảng dạy", href: "/teacher/courses" }
      : { label: "Khóa học của tôi", href: "/my-courses" };

  // Students: Bài tập + Đơn hàng + Cài đặt; Parents: Đơn hàng + Cài đặt; Teachers/Admins: only Cài đặt
  const userMenuItems = [
    ...(isStudent ? studentMenuItems : []),
    ...(canSeeOrders ? [ordersMenuItem] : []),
    ...commonMenuItems,
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isInDesktopDropdown = dropdownRef.current?.contains(target);
      const isInNotification = notificationRef.current?.contains(target);
      const isInMobileMenu = mobileMenuRef.current?.contains(target);

      if (!isInDesktopDropdown && !isInNotification && !isInMobileMenu) {
        setIsDropdownOpen(false);
        setIsNotificationOpen(false);
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openLogin = () => {
    setIsMobileMenuOpen(false);
    setAuthModal({ isOpen: true, mode: "login" });
  };
  const openRegister = () => {
    setIsMobileMenuOpen(false);
    setAuthModal({ isOpen: true, mode: "register" });
  };
  const closeAuthModal = () => setAuthModal({ isOpen: false, mode: "login" });

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/90 border-b border-border backdrop-blur-md z-50 flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-6 lg:gap-12">
          <Link href={homeHref} className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <ForteXLogoIcon size={32} className="text-foreground" />
            <span className="font-heading text-xl font-bold text-foreground tracking-tight">{siteConfig.name}</span>
          </Link>

          <GlobalSearch />
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          {/* Coin balance */}
          {isAuthenticated && canUseCoinWallet(activeRole) && (
            <Link href="/coins" className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 transition-colors">
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{coinBalance.toLocaleString("vi-VN")}</span>
            </Link>
          )}

          {/* Cart - only show for students */}
          {isAuthenticated && isStudent && (
            <div className="hidden md:block">
              <CartDropdown />
            </div>
          )}

          <div className="relative hidden md:block" ref={notificationRef}>
            <button
              className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => {
                setIsDropdownOpen(false);
                setIsNotificationOpen((v) => !v);
              }}
              aria-label={unreadCount > 0 ? `Thông báo (${unreadCount} chưa đọc)` : "Thông báo"}
              aria-expanded={isNotificationOpen}
              aria-haspopup="dialog"
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 top-12 w-96 bg-popover rounded-2xl overflow-hidden z-50 shadow-raised border border-border">
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-foreground" />
                    <p className="font-medium text-foreground">Thông báo</p>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-muted text-foreground text-xs font-medium rounded-full">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      className="text-xs text-foreground hover:text-muted-foreground font-medium disabled:opacity-50"
                      onClick={() => markAllReadMutation.mutate()}
                      disabled={markAllReadMutation.isPending}
                    >
                      Đọc tất cả
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                        <Bell className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Không có thông báo nào</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        className={`w-full text-left px-5 py-4 hover:bg-muted transition-colors border-b border-border last:border-0 ${!item.is_read ? "bg-primary-50/50 dark:bg-primary-900/20" : ""}`}
                        onClick={() => {
                          if (!item.is_read) markReadMutation.mutate(item.id);
                          setIsNotificationOpen(false);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!item.is_read ? "bg-primary-500" : "bg-transparent"}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${!item.is_read ? "text-foreground font-medium" : "text-foreground"}`}>
                              {item.title}
                            </p>
                            {item.content && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1.5">{timeAgo(item.created_at)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-5 py-3 border-t border-border bg-muted">
                    <Link
                      href="/notifications"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      onClick={() => setIsNotificationOpen(false)}
                    >
                      Xem tất cả thông báo
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2" ref={dropdownRef}>
            {isAuthenticated ? (
              <>
                <Link href={primaryNav.href}>
                  <Button variant="outline" className="font-medium text-sm">
                    {primaryNav.label}
                  </Button>
                </Link>

                <button
                  onClick={() => setIsDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Menu tài khoản của ${user?.name || "bạn"}`}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="menu"
                >
                  <Avatar fallback={user?.name || "TK"} size="sm" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-4 top-14 w-72 bg-popover rounded-2xl py-2 z-50 shadow-raised border border-border">
                    <div className="px-4 py-3 border-b">
                      <p className="font-semibold text-foreground">{user?.name || "Tài khoản"}</p>
                      <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
                    </div>

                    {/* Role Switcher */}
                    {availableRoles.length > 0 && (
                      <div className="border-b">
                        <button
                          onClick={() => setShowRoleSwitcher((v) => !v)}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Chuyển vai trò</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {activeUnifiedRole && normalizedRole && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE_CLASS}`}>
                                {getRoleDisplay(normalizedRole).label}
                              </span>
                            )}
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showRoleSwitcher ? "rotate-180" : ""}`} />
                          </div>
                        </button>
                        {showRoleSwitcher && (
                          <div className="px-2 pb-2 space-y-1">
                            <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                              Vai trò của bạn
                            </p>
                            {availableRoles.map((role) => {
                              const isActive = activeUnifiedRole?.id === role.id;
                              const config = getRoleDisplay(role.role_name);
                              return (
                                <button
                                  key={role.id}
                                  disabled={isActive || switchRoleMutation.isPending}
                                  onClick={() => {
                                    switchRoleMutation.mutate({
                                      role_id: role.id,
                                      role_type: role.type,
                                      organization_id: role.organization_id || undefined,
                                    });
                                    setShowRoleSwitcher(false);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition-all ${
                                    isActive
                                      ? "bg-primary-50 ring-1 ring-primary-200 dark:bg-primary-900/30 dark:ring-primary-800"
                                      : "hover:bg-muted"
                                  } disabled:opacity-60`}
                                >
                                  <span className={`w-9 h-9 rounded-full flex items-center justify-center ${ROLE_BADGE_CLASS}`}>
                                    <config.icon className="w-5 h-5" aria-hidden="true" />
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${isActive ? "text-primary-700 dark:text-primary-300" : "text-foreground"}`}>
                                      {config.label}
                                    </p>
                                    {role.organization_name && (
                                      <p className="text-xs text-muted-foreground truncate">{role.organization_name}</p>
                                    )}
                                  </div>
                                  {isActive && (
                                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="py-2">
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <Icon className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm text-foreground">{item.label}</span>
                            {item.badge && <span className="ml-auto w-2 h-2 rounded-full bg-red-500" />}
                          </Link>
                        );
                      })}
                    </div>

                    <div className="border-t pt-2">
                      <button
                        className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-muted transition-colors text-red-600 dark:text-red-400 disabled:opacity-60"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logoutMutation.mutate();
                        }}
                        disabled={logoutMutation.isPending}
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm">Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-foreground hover:text-foreground font-medium" onClick={openLogin}>
                  Đăng nhập
                </Button>
                <Button className="font-medium" onClick={openRegister}>
                  Đăng ký
                </Button>
              </>
            )}
          </div>

          <div className="relative sm:hidden" ref={mobileMenuRef}>
            <button
              className="p-2 text-muted-foreground rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"} aria-expanded={isMobileMenuOpen}
              onClick={() => {
                setIsDropdownOpen(false);
                setIsNotificationOpen(false);
                setIsMobileMenuOpen((v) => !v);
              }}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {isMobileMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-popover rounded-2xl shadow-raised border border-border py-2 z-50">
                {isAuthenticated ? (
                  <>
                    <div className="px-3 pt-3">
                      <Link href={primaryNav.href} onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start font-medium">
                          {primaryNav.label}
                        </Button>
                      </Link>
                    </div>

                    <div className="px-4 py-3 border-b">
                      <p className="font-semibold text-foreground">{user?.name || "Tài khoản"}</p>
                      <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
                    </div>

                    <div className="py-2">
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={`mobile-${item.href}`}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Icon className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm text-foreground">{item.label}</span>
                            {item.badge && <span className="ml-auto w-2 h-2 rounded-full bg-red-500" />}
                          </Link>
                        );
                      })}
                    </div>

                    <div className="border-t pt-2">
                      <button
                        className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-muted transition-colors text-red-600 dark:text-red-400 disabled:opacity-60"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logoutMutation.mutate();
                        }}
                        disabled={logoutMutation.isPending}
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm">Đăng xuất</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="px-3 py-2 flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start" onClick={openLogin}>
                      Đăng nhập
                    </Button>
                    <Button onClick={openRegister}>
                      Đăng ký
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={authModal.isOpen} onClose={closeAuthModal} initialMode={authModal.mode} />
    </>
  );
}
