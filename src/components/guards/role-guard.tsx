"use client";

/**
 * Route-level role protection component
 * Usage: <RoleGuard roles={["SYSTEM_ADMIN"]}><AdminPage /></RoleGuard>
 */

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import type { Permission } from "@/lib/permissions";
import { normalizeRole, AUTH_ROUTES } from "@/lib/routes";

interface RoleGuardProps {
  roles?: string[];
  permissions?: Permission[];
  permissionMode?: "any" | "all";
  redirectTo?: string;
  /**
   * Mất phiên (anonymous) → gắn `?redirect=<trang hiện tại>` vào `redirectTo` để đăng nhập lại xong
   * quay về đúng chỗ (C3). Dùng cho layout server component không tự lấy được pathname.
   */
  returnToCurrentPath?: boolean;
  children: React.ReactNode;
}

export function RoleGuard({
  roles,
  permissions: requiredPerms,
  permissionMode = "any",
  redirectTo = "/login",
  returnToCurrentPath = false,
  children,
}: RoleGuardProps) {
  const router = useRouter();
  const { sessionStatus, activeRole, permissions, sessionEndedByUser } = useAuthStore();
  const normalizedRole = normalizeRole(activeRole);
  const normalizedAllowedRoles = useMemo(
    () => roles?.map((role) => normalizeRole(role)).filter(Boolean) as string[] | undefined,
    [roles]
  );
  const hasPermissionAccess = requiredPerms
    ? permissionMode === "any"
      ? requiredPerms.some((p) => permissions.includes(p))
      : requiredPerms.every((p) => permissions.includes(p))
    : true;

  useEffect(() => {
    if (sessionStatus === "checking") return;

    // Redirect only when this protected surface knows the session is anonymous.
    if (sessionStatus === "anonymous") {
      // Đăng xuất chủ động: về trang chủ, bỏ qua `redirectTo` (admin truyền sẵn ?redirect=) và
      // `returnToCurrentPath`. Chỉ mất phiên thật mới giữ đường quay lại (re-review PR #33).
      if (sessionEndedByUser) {
        router.replace("/");
        return;
      }
      // Đọc window.location trong effect (chỉ chạy ở client) thay vì useSearchParams: không bắt
      // layout phải bọc Suspense, và lấy được cả query string của trang đang xem.
      const current = `${window.location.pathname}${window.location.search}`;
      router.replace(
        returnToCurrentPath ? `${redirectTo}?redirect=${encodeURIComponent(current)}` : redirectTo
      );
      return;
    }

    // Authenticated but no role selected → redirect to role selection
    if (!normalizedRole) {
      router.replace(AUTH_ROUTES.LOGIN_ROLE);
      return;
    }

    // Authenticated but unauthorized role -> redirect to 403 (forbidden)
    if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(normalizedRole)) {
      router.replace("/403");
      return;
    }

    // Authenticated but unauthorized permission -> redirect to 403
    if (!hasPermissionAccess) {
      router.replace("/403");
    }
  }, [
    sessionStatus,
    normalizedRole,
    normalizedAllowedRoles,
    permissions,
    hasPermissionAccess,
    router,
    redirectTo,
    returnToCurrentPath,
    sessionEndedByUser,
  ]);

  // Never reveal protected children until cookie-backed bootstrap is complete.
  if (sessionStatus !== "authenticated") return null;
  if (!normalizedRole) return null;
  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(normalizedRole)) return null;
  if (!hasPermissionAccess) return null;

  return <>{children}</>;
}
