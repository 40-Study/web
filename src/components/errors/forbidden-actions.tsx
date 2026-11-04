"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleSwitchList } from "@/components/layout/role-switch-list";
import { useLogout } from "@/hooks/queries/use-auth";
import { useSystemRoleRemap } from "@/hooks/use-system-role-remap";
import { useAuthStore } from "@/stores/auth.store";
import { resolveHomeRoute } from "@/lib/role-resolution";

/**
 * Lối thoát của trang 403 (Q3-05). Trước đây chỉ có link tới "/", mà "/" lại chuyển người đã đăng nhập về
 * trang chủ của vai rồi bị chặn lại -> vòng lặp không thoát được. Nay: về home THẬT theo vai hệ thống,
 * chuyển vai trò (nếu có nhiều vai) và đăng xuất.
 */
export function ForbiddenActions() {
  const { isAuthenticated, hasHydrated, activeRole, roles } = useAuthStore();
  const logout = useLogout();
  // Vai tuỳ biến còn sót trong store (vd QA3_TEACHER) -> ghi vai hệ thống để trang chủ/menu sau đó dựng đúng giao diện.
  useSystemRoleRemap();
  const signedIn = hasHydrated && isAuthenticated;
  const homeHref = signedIn ? resolveHomeRoute(activeRole, roles) : "/";

  return (
    <div className="mt-6 flex w-full max-w-xs flex-col items-stretch gap-3">
      <Link
        href={homeHref}
        className="rounded-lg bg-primary-600 px-6 py-2 text-center text-white hover:bg-primary-700"
      >
        Về trang chủ
      </Link>
      {signedIn && (
        <>
          <RoleSwitchList />
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Đăng xuất
          </Button>
        </>
      )}
    </div>
  );
}
