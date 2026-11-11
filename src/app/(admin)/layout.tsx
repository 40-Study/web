"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LogOut, Settings } from "lucide-react";

import { RoleGuard } from "@/components/guards";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { Avatar } from "@/components/ui/avatar";
import { useLogout, useMyRoles, useSwitchRole } from "@/hooks/queries/use-auth";
import { cn } from "@/lib/utils";
import { adminMenu, getVisibleAdminMenu } from "@/lib/admin-menu";
import { findActiveAdminNavItem, isAdminNavActive } from "@/lib/admin-nav";
import { getSystemRoleLabel } from "@/lib/role-labels";
import { useAuthStore } from "@/stores/auth.store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, activeUnifiedRole, roles } = useAuthStore();
  const permissions = useAuthStore((s) => s.permissions);
  const visibleMenu = getVisibleAdminMenu(permissions);
  const pageSubtitle = findActiveAdminNavItem(pathname, adminMenu)?.description ?? "Quản trị nền tảng ForteX";
  const logoutMutation = useLogout();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  // QA3-20: admin có thêm vai trò khác (vd chủ tổ chức) phải đổi vai trò được ngay trong app, như menu
  // tài khoản của header chính. Dùng chung cơ chế `useSwitchRole`; chỉ hiện khi có từ 2 vai trò trở lên.
  const switchRoleMutation = useSwitchRole();
  const { data: myRolesData } = useMyRoles();
  const availableRoles = myRolesData?.roles ?? roles ?? [];
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
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
    // Review đối kháng PR #24 (MAJOR): trước đây cho cả ORG_OWNER vào toàn bộ /admin/**, nhưng
    // 40Study là B2C MỘT doanh nghiệp (không đa tổ chức) — data/roles.json (backend) cho ORG_OWNER
    // chỉ các quyền phạm vi tổ chức (ORG_MEMBERS_MANAGE, ORG_ROLES_MANAGE, ORG_CATEGORIES_MANAGE,
    // COURSES_APPROVE_OWN_ORG, COURSES_DELETE_ORG, REPORTS_VIEW_ORG, TRACKING_VIEW_ORG_STUDENTS),
    // KHÔNG có ROLES_MANAGE_SYSTEM / REPORTS_MODERATE / CATEGORIES_SYSTEM_MANAGE mà 4/6 trang khu
    // vực này cần thật. Cho ORG_OWNER vào rồi để họ dính 403 ở từng lệnh gọi API là UI hứa hẹn
    // thứ họ không làm được — chỉ SYSTEM_ADMIN mới vào được /admin/**; ORG_OWNER bị RoleGuard đá
    // thẳng về /403 (không phải màn trắng). Không có trang admin nào hiện tại dùng quyền phạm vi
    // tổ chức của ORG_OWNER, nên không giữ riêng trang nào cho vai này.
    // Mất phiên giữa chừng: quay lại đúng trang admin đang xem sau khi đăng nhập lại (C3).
    <RoleGuard roles={["SYSTEM_ADMIN"]} redirectTo={`/login?redirect=${encodeURIComponent(pathname)}`}>
      <div className="flex min-h-screen bg-background">
        <aside className="hidden w-72 shrink-0 border-r border-border bg-card md:flex md:flex-col">
          <div className="border-b border-border px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Hệ thống quản trị
            </p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-foreground">ForteX Admin</h2>
          </div>
          <nav className="space-y-2 p-3" aria-label="Menu quản trị">
            {visibleMenu.map((item) => {
              const isActive = isAdminNavActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border bg-card">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
              <div className="min-w-0">
                <h1 className="font-heading text-base font-semibold text-foreground">Trang quản trị</h1>
                <p className="truncate text-xs text-muted-foreground">{pageSubtitle}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {/* Bảng lệnh Ctrl+K chỉ nhận đúng các mục admin đang được thấy (cùng danh sách với sidebar). */}
                <CommandPalette items={visibleMenu} areaLabel="khu quản trị" />
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Avatar src={user?.avatar} fallback={user?.name || "AD"} size="sm" />
                    <span className="hidden text-sm font-medium md:inline">{user?.name || "Administrator"}</span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-11 w-52 rounded-2xl border border-border bg-popover py-2 shadow-raised">
                      {/* A-P2-4 (cũ): link /settings từng bị (app)/layout.tsx đá về /admin; nay đã mở được (xem mục Tài khoản bên dưới). */}
                      {availableRoles.length > 1 && (
                        <div className="mb-1 border-b border-border pb-1">
                          <button
                            type="button"
                            aria-expanded={showRoleSwitcher}
                            onClick={() => setShowRoleSwitcher((v) => !v)}
                            className="flex w-full items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-muted"
                          >
                            Chuyển vai trò
                            <ChevronDown className={cn("h-4 w-4 transition-transform", showRoleSwitcher && "rotate-180")} aria-hidden="true" />
                          </button>
                          {showRoleSwitcher && (
                            <ul className="space-y-1 px-2 pb-1" aria-label="Vai trò của bạn">
                              {availableRoles.map((role) => {
                                const isActive = activeUnifiedRole?.id === role.id;
                                return (
                                  <li key={role.id}>
                                    <button
                                      type="button"
                                      disabled={isActive || switchRoleMutation.isPending}
                                      onClick={() => {
                                        setIsProfileOpen(false);
                                        setShowRoleSwitcher(false);
                                        switchRoleMutation.mutate({
                                          role_id: role.id,
                                          role_type: role.type,
                                          organization_id: role.organization_id || undefined,
                                        });
                                      }}
                                      className={cn(
                                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm disabled:opacity-60",
                                        isActive ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" : "hover:bg-muted"
                                      )}
                                    >
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate font-medium">{getSystemRoleLabel(role.role_name)}</span>
                                        {role.organization_name?.trim() && (
                                          <span className="block truncate text-xs text-muted-foreground">{role.organization_name.trim()}</span>
                                        )}
                                      </span>
                                      {isActive && <Check className="h-4 w-4 shrink-0" aria-label="Đang dùng" />}
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      )}
                      {/* QA-C-23: menu avatar từng chỉ có "Đăng xuất". (app)/layout.tsx nay cho admin mở /settings
                          (đã kiểm sống 10/11/2026), nên thêm lối vào Tài khoản như khu /org. */}
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
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
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <AdminMobileNav items={visibleMenu} isActive={(href) => isAdminNavActive(pathname, href)} />
          </header>

          {/* id="main-content": đích của skip link trong app/layout.tsx (H-04) */}
          <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
