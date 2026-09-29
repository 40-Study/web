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
  getRoleRestrictedRedirect,
  CONTEST_PARTICIPANT_ROUTE_PATTERN,
} from "@/lib/routes";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, hasHydrated, activeRole, sessionStatus, sessionEndedByUser } = useAuthStore();
  const normalizedRole = normalizeRole(activeRole);
  const isAdminRole = normalizedRole === "SYSTEM_ADMIN" || normalizedRole === "ORG_OWNER";

  const isContestRoute = pathname === "/contests" || pathname.startsWith("/contests/");
  // Làm bài/kết quả/chứng nhận cần đăng nhập (middleware.ts cũng chặn) — không coi là public để
  // nhánh mất phiên bên dưới đưa về /login thay vì render trang rỗng.
  const isContestParticipantRoute = CONTEST_PARTICIPANT_ROUTE_PATTERN.test(pathname);

  const isPublicRoute =
    pathname === "/courses" ||
    pathname.startsWith("/courses/") ||
    pathname === "/discussions" ||
    pathname.startsWith("/discussions/") ||
    pathname.startsWith("/profile/") ||
    (isContestRoute && !isContestParticipantRoute);

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
  // Cuộc thi (contract §7): admin xem danh sách/chi tiết ở chế độ chỉ đọc. Route con làm bài/kết
  // quả để backend trả 403/404 và trang hiện thông báo, không đẩy admin về /admin im lặng.
  const isAdminAllowedRoute =
    ADMIN_ALLOWED_EXACT_ROUTES.includes(pathname) || pathname.startsWith("/profile/") || isContestRoute;

  // Review PR #26 MAJOR #1: menu ẩn "Cuộc thi"/"Nhóm"/"Xu"/"Thành tích"/
  // "Bảng xếp hạng"... với phụ huynh (`sidebar.tsx`/`bottom-nav.tsx`) nhưng
  // route vẫn mở — gõ thẳng URL vẫn vào được y nguyên nội dung học sinh. Route
  // guard PHẢI đọc CÙNG bảng data-driven `ROLE_SCOPED_ROUTES` (lib/routes.ts)
  // với menu, không tự kiểm role rời — nếu không sẽ lại lệch y hệt bug này.
  // Chỉ áp cho STUDENT/PARENT: ADMIN đã có cơ chế riêng ở trên
  // (ADMIN_ALLOWED_EXACT_ROUTES), GUEST/no-role không chạy qua nhánh này.
  //
  // CỐ Ý không loại trừ theo `isPublicRoute`: route public với khách vẫn có
  // thể bị chặn với một vai đã đăng nhập. Từ MVP "Cuộc thi" (contract §7, chủ
  // dự án 28/09) phụ huynh XEM được "/contests" và trang chi tiết, nhưng bị
  // chặn ở làm bài/kết quả/chứng nhận (ROLE_SCOPED_PATTERNS, lib/routes.ts).
  const navRole = resolveNavRole(isAuthenticated, normalizedRole);
  const isRoleRestrictedRoute =
    isAuthenticated &&
    !isAdminRole &&
    !!normalizedRole &&
    !isRouteAllowedForRole(pathname, navRole);

  // N-08 (QA admin 260928, P1): mất phiên (bị khoá giữa phiên, token hết hạn) → bootstrap đặt
  // `anonymous` nhưng layout chỉ `return null` và KHÔNG có nhánh điều hướng nào — RoleGuard (nơi
  // có redirect /login) nằm BÊN DƯỚI lệnh return null đó nên không bao giờ mount → trang trắng vĩnh
  // viễn, kể cả sau khi tải lại. Chỉ điều hướng khi bootstrap đã KẾT LUẬN (`anonymous`), không
  // điều hướng lúc `checking` để khỏi đá người dùng đang khôi phục phiên hợp lệ.
  const isSessionLost = hasHydrated && sessionStatus === "anonymous" && !isPublicRoute;

  useEffect(() => {
    if (!hasHydrated) return;

    if (isSessionLost) {
      // Đăng xuất chủ động: về trang chủ, KHÔNG gắn ?redirect (người đăng nhập sau không bị đẩy
      // tới trang của người trước). Chỉ mất phiên thật mới giữ đường quay lại.
      if (sessionEndedByUser) {
        router.replace("/");
        return;
      }
      // Trang login đọc `?redirect=` (lưu sessionStorage, dùng sau khi đăng nhập xong).
      const current = `${window.location.pathname}${window.location.search}`;
      router.replace(`${AUTH_ROUTES.LOGIN}?redirect=${encodeURIComponent(current)}`);
      return;
    }

    // Admin roles should go to admin dashboard — trừ các trang tài khoản cá nhân được phép ở trên.
    if (isAuthenticated && isAdminRole && !isAdminAllowedRoute) {
      router.replace("/admin");
      return;
    }

    // Route không dành cho role hiện tại (vd phụ huynh gõ thẳng /achievements)
    // → về home của role đó, không phải màn trắng vô thời hạn. Riêng route con cuộc thi
    // (phụ huynh mở /contests/x/play) về trang chi tiết cuộc thi đó (contract §7).
    if (isRoleRestrictedRoute) {
      router.replace(getRoleRestrictedRedirect(pathname, normalizedRole));
      return;
    }

    // Authenticated but no role → redirect to role selection
    if (isAuthenticated && !normalizedRole && !isPublicRoute) {
      router.replace(AUTH_ROUTES.LOGIN_ROLE);
    }
  }, [
    hasHydrated,
    isSessionLost,
    sessionEndedByUser,
    isAuthenticated,
    isAdminRole,
    isAdminAllowedRoute,
    isRoleRestrictedRoute,
    normalizedRole,
    isPublicRoute,
    pathname,
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

  // Đang chuyển về /login (useEffect ở trên): hiện chữ thay vì màn trắng, phòng khi điều hướng chậm.
  if (isSessionLost) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-sm text-muted-foreground" role="status">
        {sessionEndedByUser ? "Đang đăng xuất…" : "Đang chuyển tới trang đăng nhập…"}
      </div>
    );
  }

  // Đang kiểm tra phiên, hoặc đã đăng nhập nhưng chưa chọn vai trò (useEffect chuyển sang chọn vai trò).
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
