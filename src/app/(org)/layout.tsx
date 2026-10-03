"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Building2, GraduationCap, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";

import { RoleGuard } from "@/components/guards";
import { Avatar } from "@/components/ui/avatar";
import { useLogout } from "@/hooks/queries/use-auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

const orgMenu = [
  { label: "Tổng quan", href: "/org", icon: LayoutDashboard, exact: true },
  { label: "Thành viên", href: "/org/members", icon: Users, exact: false },
  { label: "Lớp học", href: "/org/classes", icon: GraduationCap, exact: false },
];

/**
 * Khu quản lý tổ chức cho chủ/quản trị tổ chức (ORG_OWNER), tách khỏi khu /admin của quản trị hệ thống:
 * ORG_OWNER chỉ có quyền phạm vi tổ chức (ORG_MEMBERS_MANAGE, ...) nên /admin/** không có gì dùng được cho vai này
 * (xem (admin)/layout.tsx), còn /org/** chỉ dùng đúng các API mà quyền đó cho phép.
 */
export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, activeOrg } = useAuthStore();
  const logoutMutation = useLogout();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const isActive = (item: (typeof orgMenu)[number]) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <RoleGuard roles={["ORG_OWNER"]} redirectTo={`/login?redirect=${encodeURIComponent(pathname)}`}>
      <div className="flex min-h-screen bg-background">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
          <div className="border-b border-border px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quản lý tổ chức</p>
            <h2 className="mt-1 flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
              <Building2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="truncate">{activeOrg?.name || "Tổ chức của bạn"}</span>
            </h2>
          </div>
          <nav className="space-y-2 p-3" aria-label="Menu tổ chức">
            {orgMenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item)
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border bg-card">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
              <div className="min-w-0">
                <h1 className="truncate font-heading text-base font-semibold text-foreground">
                  {activeOrg?.name || "Tổ chức của bạn"}
                </h1>
                <p className="text-xs text-muted-foreground">Thành viên và lớp học của tổ chức</p>
              </div>
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                >
                  <Avatar src={user?.avatar} fallback={user?.name || "TC"} size="sm" />
                  <span className="hidden text-sm font-medium md:inline">{user?.name || "Chủ tổ chức"}</span>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 top-11 w-52 rounded-2xl border border-border bg-popover py-2 shadow-raised" role="menu">
                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                      role="menuitem"
                    >
                      <Settings className="h-4 w-4" aria-hidden="true" />
                      Tài khoản
                    </Link>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logoutMutation.mutate();
                      }}
                      disabled={logoutMutation.isPending}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2 md:hidden" aria-label="Menu tổ chức">
              {orgMenu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium",
                    isActive(item)
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>

          <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
