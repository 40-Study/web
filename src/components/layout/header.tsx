"use client";

import Link from "next/link";
import { ForteXLogoIcon } from "@/components/landing/fortex-logo-icon";
import { useState, useRef, useEffect } from "react";
import { Bell, FileText, Settings, LogOut, Menu, X, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { AuthModal } from "@/components/auth/auth-modal";
import { GlobalSearch } from "@/components/layout/global-search";
import { CartDropdown } from "@/components/layout/cart-dropdown";
import { useLogout } from "@/hooks/queries/use-auth";
import { useAuthStore } from "@/stores/auth.store";
import { getRoleHomeRoute, normalizeRole } from "@/lib/routes";
import { useNotifications, useUnreadCount, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/queries/use-notifications";
import { useNotificationSocket } from "@/hooks/use-notification-socket";

interface MenuItem {
  label: string;
  href: string;
  icon: typeof FileText;
  badge?: boolean;
}

// Student-only menu items (shown before common items)
const studentMenuItems: MenuItem[] = [
  { label: "Bài tập", href: "/my-assignments", icon: FileText, badge: true },
  { label: "Voucher của tôi", href: "/my-vouchers", icon: Ticket },
];

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

  const { isAuthenticated, user, activeRole } = useAuthStore();
  const logoutMutation = useLogout();

  // Notification hooks — only fetch when authenticated
  const { data: unreadData } = useUnreadCount();
  const { data: notifData } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  // Initialize WebSocket connection for real-time notifications
  useNotificationSocket();

  const unreadCount = isAuthenticated ? (unreadData?.unread_count ?? 0) : 0;
  const notifications = isAuthenticated ? (notifData?.notifications ?? []) : [];
  const normalizedRole = normalizeRole(activeRole);
  const isStudent = normalizedRole === "STUDENT";
  const homeHref = isAuthenticated ? getRoleHomeRoute(normalizedRole) : "/";

  // Students: Bài tập + Cài đặt; Teachers/Admins: only Cài đặt
  const userMenuItems = [...(isStudent ? studentMenuItems : []), ...commonMenuItems];

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
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md z-50 flex items-center justify-between px-4 lg:px-8" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-6 lg:gap-12">
          <Link href={homeHref} className="flex items-center gap-2">
            <ForteXLogoIcon size={32} className="text-black" />
            <span className="text-xl font-light text-black tracking-tight">ForteX</span>
          </Link>

          <GlobalSearch />
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          {/* Cart - only show for students */}
          {isAuthenticated && isStudent && (
            <div className="hidden md:block">
              <CartDropdown />
            </div>
          )}

          <div className="relative hidden md:block" ref={notificationRef}>
            <button
              className="relative p-2 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
              onClick={() => {
                setIsDropdownOpen(false);
                setIsNotificationOpen((v) => !v);
              }}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl overflow-hidden z-50" style={{ boxShadow: 'rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 24px' }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-black" />
                    <p className="font-medium text-black">Thông báo</p>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-neutral-100 text-black text-xs font-medium rounded-full">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      className="text-xs text-black hover:text-neutral-600 font-medium disabled:opacity-50"
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
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                        <Bell className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Không có thông báo nào</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!item.is_read ? "bg-primary-50/50" : ""}`}
                        onClick={() => {
                          if (!item.is_read) markReadMutation.mutate(item.id);
                          setIsNotificationOpen(false);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!item.is_read ? "bg-primary-500" : "bg-transparent"}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${!item.is_read ? "text-gray-900 font-medium" : "text-gray-700"}`}>
                              {item.title}
                            </p>
                            {item.content && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.content}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1.5">{timeAgo(item.created_at)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
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
                <Link href={homeHref}>
                  <Button variant="outline" className="font-medium text-sm">
                    Trang quản lý
                  </Button>
                </Link>

                <button
                  onClick={() => setIsDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-100 transition-colors"
                >
                  <Avatar fallback={user?.name || "TK"} size="sm" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-4 top-14 w-64 bg-white rounded-2xl py-2 z-50" style={{ boxShadow: 'rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 24px' }}>
                    <div className="px-4 py-3 border-b">
                      <p className="font-semibold text-gray-900">{user?.name || "Tài khoản"}</p>
                      <p className="text-sm text-gray-500">{user?.email || ""}</p>
                    </div>

                    <div className="py-2">
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <Icon className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-700">{item.label}</span>
                            {item.badge && <span className="ml-auto w-2 h-2 rounded-full bg-red-500" />}
                          </Link>
                        );
                      })}
                    </div>

                    <div className="border-t pt-2">
                      <button
                        className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-gray-50 transition-colors text-red-600 disabled:opacity-60"
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
                <Button variant="ghost" className="text-black hover:text-black font-medium" onClick={openLogin}>
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
              className="p-2 text-slate-500"
              onClick={() => {
                setIsDropdownOpen(false);
                setIsNotificationOpen(false);
                setIsMobileMenuOpen((v) => !v);
              }}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {isMobileMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-lg border py-2 z-50">
                {isAuthenticated ? (
                  <>
                    <div className="px-3 pt-3">
                      <Link href={homeHref} onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start font-medium">
                          Trang quản lý
                        </Button>
                      </Link>
                    </div>

                    <div className="px-4 py-3 border-b">
                      <p className="font-semibold text-gray-900">{user?.name || "Tài khoản"}</p>
                      <p className="text-sm text-gray-500">{user?.email || ""}</p>
                    </div>

                    <div className="py-2">
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={`mobile-${item.href}`}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Icon className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-700">{item.label}</span>
                            {item.badge && <span className="ml-auto w-2 h-2 rounded-full bg-red-500" />}
                          </Link>
                        );
                      })}
                    </div>

                    <div className="border-t pt-2">
                      <button
                        className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-gray-50 transition-colors text-red-600 disabled:opacity-60"
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
                    <Button className="bg-primary-600 hover:bg-primary-700 text-white" onClick={openRegister}>
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
