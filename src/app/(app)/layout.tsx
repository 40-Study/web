"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShellLayout } from "@/components/layout/app-shell-layout";
import { RoleGuard } from "@/components/guards/role-guard";
import { useAuthStore } from "@/stores/auth.store";
import {
  normalizeRole,
  AUTH_ROUTES,
  resolveNavRole,
  isRouteAllowedForRole,
  getRoleHomeRoute,
} from "@/lib/routes";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, hasHydrated, activeRole } = useAuthStore();
  const normalizedRole = normalizeRole(activeRole);
  const isAdminRole = normalizedRole === "SYSTEM_ADMIN" || normalizedRole === "ORG_OWNER";

  const isPublicRoute =
    pathname === "/courses" ||
    pathname.startsWith("/courses/") ||
    pathname === "/discussions" ||
    pathname.startsWith("/discussions/") ||
    pathname.startsWith("/profile/") ||
    pathname === "/contests" ||
    pathname.startsWith("/contests/");

  // A-P2-4 (QA 260927 admin): admin bị ép về /admin ngay cả khi chỉ muốn vào
  // trang tài khoản cá nhân (đổi mật khẩu, thiết bị, thông báo, tin nhắn, hồ
  // sơ) — không có cách nào đổi mật khẩu/xem thiết bị từ `(admin)/**`. Danh
  // sách route CHO PHÉP admin cùng cấu hình data-driven với menu theo role
  // (`components/layout/sidebar.tsx`/`bottom-nav.tsx` tự ẩn menu học
  // sinh/game-hoá cho vai ADMIN — không lặp logic ở đây).
  // Khớp CHÍNH XÁC — không dùng prefix "/settings" (sẽ vô tình cho phép luôn
  // "/settings/family", trang chỉ dành cho học sinh/phụ huynh mà admin
  // không có lý do vào).
  const ADMIN_ALLOWED_EXACT_ROUTES = ["/settings", "/settings/devices", "/notifications", "/messages"];
  const isAdminAllowedRoute =
    ADMIN_ALLOWED_EXACT_ROUTES.includes(pathname) || pathname.startsWith("/profile/");

  // Review PR #26 MAJOR #1: menu ẩn "Cuộc thi"/"Nhóm"/"Xu"/"Thành tích"/
  // "Bảng xếp hạng"... với phụ huynh (`sidebar.tsx`/`bottom-nav.tsx`) nhưng
  // route vẫn mở — gõ thẳng URL vẫn vào được y nguyên nội dung học sinh. Route
  // guard PHẢI đọc CÙNG bảng data-driven `ROLE_SCOPED_ROUTES` (lib/routes.ts)
  // với menu, không tự kiểm role rời — nếu không sẽ lại lệch y hệt bug này.
  // Chỉ áp cho STUDENT/PARENT: ADMIN đã có cơ chế riêng ở trên
  // (ADMIN_ALLOWED_EXACT_ROUTES), GUEST/no-role không chạy qua nhánh này.
  //
  // CỐ Ý không loại trừ theo `isPublicRoute`: "/contests" nằm trong
  // `isPublicRoute` (để khách chưa đăng nhập xem được) NHƯNG với vai PHỤ
  // HUYNH đã đăng nhập vẫn phải bị chặn — coordinator liệt kê rõ "/contests"
  // là 1 trong 5 route phụ huynh không được vào. Nếu thêm `!isPublicRoute`
  // vào đây thì "/contests" lại lọt y hệt lỗi review vừa sửa.
  const navRole = resolveNavRole(isAuthenticated, normalizedRole);
  const isRoleRestrictedRoute =
    isAuthenticated &&
    !isAdminRole &&
    !!normalizedRole &&
    !isRouteAllowedForRole(pathname, navRole);

  useEffect(() => {
    if (!hasHydrated) return;

    // Admin roles should go to admin dashboard — trừ các trang tài khoản cá nhân được phép ở trên.
    if (isAuthenticated && isAdminRole && !isAdminAllowedRoute) {
      router.replace("/admin");
      return;
    }

    // Route không dành cho role hiện tại (vd phụ huynh gõ thẳng /achievements)
    // → về home của role đó, không phải màn trắng vô thời hạn.
    if (isRoleRestrictedRoute) {
      router.replace(getRoleHomeRoute(normalizedRole));
      return;
    }

    // Authenticated but no role → redirect to role selection
    if (isAuthenticated && !normalizedRole && !isPublicRoute) {
      router.replace(AUTH_ROUTES.LOGIN_ROLE);
    }
  }, [
    hasHydrated,
    isAuthenticated,
    isAdminRole,
    isAdminAllowedRoute,
    isRoleRestrictedRoute,
    normalizedRole,
    isPublicRoute,
    router,
  ]);

  // Show nothing while redirecting to admin
  if (hasHydrated && isAuthenticated && isAdminRole && !isAdminAllowedRoute) return null;

  // Show nothing while redirecting away from a role-restricted route
  if (hasHydrated && isRoleRestrictedRoute) return null;

  // Public routes don't need auth
  if (isPublicRoute) {
    return <AppShellLayout>{children}</AppShellLayout>;
  }

  // Wait for hydration
  if (!hasHydrated) return null;

  // Not authenticated or no role → show nothing (redirect will happen in useEffect)
  if (!isAuthenticated || !normalizedRole) return null;

  // Admin trên trang tài khoản cá nhân: qua được RoleGuard bình thường (Sidebar/
  // BottomNav tự rẽ nhánh role ADMIN sang menu rỗng, không lộ menu học sinh).
  const allowedRoles = isAdminRole
    ? ["STUDENT", "TEACHER", "PARENT", "SYSTEM_ADMIN", "ORG_OWNER"]
    : ["STUDENT", "TEACHER", "PARENT"];

  return (
    <RoleGuard roles={allowedRoles}>
      <AppShellLayout>{children}</AppShellLayout>
    </RoleGuard>
  );
}
