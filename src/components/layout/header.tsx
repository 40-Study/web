"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Search, Bell, BarChart2, Calendar, BookOpen, FileText, Settings, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { AuthModal } from "@/components/auth/auth-modal";
import { useLogout } from "@/hooks/queries/use-auth";
import { useAuthStore } from "@/stores/auth.store";
import { getRoleHomeRoute, normalizeRole } from "@/lib/routes";

const userMenuItems = [
  { label: "Tiến độ khóa học", href: "/progress", icon: BarChart2 },
  { label: "Thời khóa biểu", href: "/schedule", icon: Calendar },
  { label: "Khóa học của tôi", href: "/my-courses", icon: BookOpen },
  { label: "Bài tập", href: "/assignments", icon: FileText, badge: true },
  { label: "Cài đặt tài khoản", href: "/settings", icon: Settings },
];

const notificationItems = [
  { id: 1, title: "Có bài tập mới", time: "2 phút trước" },
  { id: 2, title: "Lớp học sắp bắt đầu", time: "15 phút trước" },
  { id: 3, title: "Bạn có phản hồi mới", time: "1 giờ trước" },
];

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
  const normalizedRole = normalizeRole(activeRole);
  const isTeacher = normalizedRole === "TEACHER";
  const homeHref = isAuthenticated ? getRoleHomeRoute(normalizedRole) : "/";

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
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-6 lg:gap-12">
          <Link href={homeHref} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              40
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ForteX</span>
          </Link>

          <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 w-64 lg:w-96">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          <div className="relative hidden md:block" ref={notificationRef}>
            <button
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
              onClick={() => {
                setIsDropdownOpen(false);
                setIsNotificationOpen((v) => !v);
              }}
            >
              <Bell className="w-5 h-5" />
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border py-2 z-50">
                <div className="px-4 py-3 border-b">
                  <p className="font-semibold text-gray-900">Thông báo</p>
                </div>
                <div className="py-1">
                  {notificationItems.map((item) => (
                    <button
                      key={item.id}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsNotificationOpen(false)}
                    >
                      <p className="text-sm text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.time}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2" ref={dropdownRef}>
            {isAuthenticated ? (
              <>
                {isTeacher && (
                  <Link href="/teacher/schedule">
                    <Button variant="outline" className="font-medium">
                      Quản lý giáo viên
                    </Button>
                  </Link>
                )}

                <button
                  onClick={() => setIsDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Avatar fallback={user?.name || "TK"} size="sm" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-4 top-14 w-64 bg-white rounded-xl shadow-lg border py-2 z-50">
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
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium" onClick={openLogin}>
                  Đăng nhập
                </Button>
                <Button className="bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-sm" onClick={openRegister}>
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
                    {isTeacher && (
                      <div className="px-3 pt-3">
                        <Link href="/teacher/schedule" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full justify-start font-medium">
                            Quản lý giáo viên
                          </Button>
                        </Link>
                      </div>
                    )}

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
