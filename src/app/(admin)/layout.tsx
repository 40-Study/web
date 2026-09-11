"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BarChart3, Building2, FileText, LayoutDashboard, LogOut, Settings, ShieldCheck } from "lucide-react";

import { RoleGuard } from "@/components/guards";
import { Avatar } from "@/components/ui/avatar";
import { useLogout } from "@/hooks/queries/use-auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

const adminMenu = [
  { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { label: "Quản lý vai trò", href: "/admin/roles", icon: ShieldCheck },
  { label: "Quản lý tổ chức", href: "/admin/organizations", icon: Building2 },
  { label: "Phân quyền", href: "/admin/permissions", icon: Settings },
  { label: "Báo cáo hệ thống", href: "/admin/reports", icon: BarChart3 },
  { label: "Nhật ký hoạt động", href: "/admin/audit-logs", icon: FileText },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <RoleGuard roles={["SYSTEM_ADMIN", "ORG_OWNER"]}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <aside className="hidden w-72 shrink-0 border-r bg-white md:flex md:flex-col dark:border-gray-800 dark:bg-gray-950">
          <div className="border-b px-5 py-4 dark:border-gray-800">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Hệ thống quản trị
            </p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">ForteX Admin</h2>
          </div>
          <nav className="space-y-2 p-3" aria-label="Menu quản trị">
            {adminMenu.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b bg-white dark:border-gray-800 dark:bg-gray-950">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
              <div>
                <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Quản lý vai trò, tổ chức và phân quyền</p>
              </div>
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Avatar src={user?.avatar} fallback={user?.name || "AD"} size="sm" />
                  <span className="hidden text-sm font-medium md:inline">{user?.name || "Administrator"}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-11 w-52 rounded-xl border bg-white py-2 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Cài đặt tài khoản
                    </Link>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logoutMutation.mutate();
                      }}
                      disabled={logoutMutation.isPending}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto border-t px-4 py-2 md:hidden dark:border-gray-800">
              {adminMenu.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                      isActive
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          {/* id="main-content": đích của skip link trong app/layout.tsx (H-04) */}
          <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
