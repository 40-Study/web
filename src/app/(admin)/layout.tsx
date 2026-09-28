"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BarChart3, Building2, Flag, FolderTree, LayoutDashboard, LogOut, Receipt, Settings, ShieldCheck, Users } from "lucide-react";

import { RoleGuard } from "@/components/guards";
import { Avatar } from "@/components/ui/avatar";
import { useLogout } from "@/hooks/queries/use-auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

const adminMenu = [
  { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { label: "Người dùng", href: "/admin/users", icon: Users },
  { label: "Quản lý vai trò", href: "/admin/roles", icon: ShieldCheck },
  { label: "Quản lý tổ chức", href: "/admin/organizations", icon: Building2 },
  { label: "Phân quyền", href: "/admin/permissions", icon: Settings },
  { label: "Danh mục khoá học", href: "/admin/categories", icon: FolderTree },
  { label: "Báo cáo vi phạm", href: "/admin/moderation", icon: Flag },
  { label: "Đơn hàng", href: "/admin/orders", icon: Receipt },
  // "Ví của tôi" (PR #24) đã được thay bằng báo cáo doanh thu nền tảng THẬT (PR #29) —
  // xem admin/reports/page.tsx. Đổi lại tên mục nav cho khớp nội dung trang thật.
  { label: "Báo cáo hệ thống", href: "/admin/reports", icon: BarChart3 },
  // TODO (Phase 3): "Nhật ký hoạt động" (/admin/audit-logs) tạm ẩn khỏi nav.
  // Trang KHÔNG trắng — nó đã có banner amber nói rõ backend chưa có endpoint
  // audit-log và hiển thị mảng rỗng có chủ đích. Lý do ẩn là mặt mục này chưa
  // có dữ liệu thật để điều hướng tới. Route + page vẫn giữ nguyên (vào được
  // bằng URL trực tiếp, vẫn qua RoleGuard của layout); bật lại mục nav khi
  // backend có API nhật ký hoạt động.
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
    // Review đối kháng PR #24 (MAJOR): trước đây cho cả ORG_OWNER vào toàn bộ /admin/**, nhưng
    // 40Study là B2C MỘT doanh nghiệp (không đa tổ chức) — data/roles.json (backend) cho ORG_OWNER
    // chỉ các quyền phạm vi tổ chức (ORG_MEMBERS_MANAGE, ORG_ROLES_MANAGE, ORG_CATEGORIES_MANAGE,
    // COURSES_APPROVE_OWN_ORG, COURSES_DELETE_ORG, REPORTS_VIEW_ORG, TRACKING_VIEW_ORG_STUDENTS),
    // KHÔNG có ROLES_MANAGE_SYSTEM / REPORTS_MODERATE / CATEGORIES_SYSTEM_MANAGE mà 4/6 trang khu
    // vực này cần thật. Cho ORG_OWNER vào rồi để họ dính 403 ở từng lệnh gọi API là UI hứa hẹn
    // thứ họ không làm được — chỉ SYSTEM_ADMIN mới vào được /admin/**; ORG_OWNER bị RoleGuard đá
    // thẳng về /403 (không phải màn trắng). Không có trang admin nào hiện tại dùng quyền phạm vi
    // tổ chức của ORG_OWNER, nên không giữ riêng trang nào cho vai này.
    <RoleGuard roles={["SYSTEM_ADMIN"]}>
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
                    {/*
                      A-P2-4: đã BỎ link "/settings" ở đây (trước đó bấm vào bị đá ngầm về /admin,
                      không có thông báo gì). Root cause thật KHÔNG nằm ở RoleGuard của khu vực
                      admin mà ở web/src/app/(app)/layout.tsx — layout dùng chung cho mọi route
                      không phải admin (student/teacher/parent), nơi có đoạn:
                        if (isAuthenticated && isAdminRole) { router.replace("/admin"); return; }
                      tức MỌI route (app) (bao gồm /settings, /notifications) đều ép admin quay
                      lại /admin. File đó nằm ngoài phạm vi sở hữu của lane này ((admin)/** +
                      role-guard.tsx) và dùng chung cho các role khác — sửa nó có thể ảnh hưởng
                      luồng của student/teacher/parent nên KHÔNG sửa ở đây. Nếu muốn admin có
                      trang cài đặt tài khoản thật, cần một lane khác thêm điều kiện ngoại lệ cho
                      "/settings"/"/notifications" vào đoạn redirect ở (app)/layout.tsx.
                    */}
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
