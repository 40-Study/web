"use client";

/**
 * Layout riêng cho ứng viên giảng viên (Phase 3).
 *
 * KHÔNG đặt trang ứng tuyển trong group (app): (app)/layout.tsx chỉ cho STUDENT/TEACHER/PARENT và
 * dựng menu học viên — ứng viên (quyền APPLICATION_VIEW_STATUS + TEACHER_PROFILE_UPDATE) bấm vào
 * đâu cũng dính 403 API. Ứng viên chỉ cần đúng 1 trang, nên layout tối giản, không menu.
 *
 * Cho phép cả TEACHER: ngay khi được duyệt, store chuyển sang TEACHER trước khi trang tải lại sang
 * khu giảng viên — chặn TEACHER ở đây sẽ nháy sang /403 trong khoảnh khắc đó.
 */

import Link from "next/link";
import { LogOut } from "lucide-react";
import { RoleGuard } from "@/components/guards/role-guard";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/queries/use-auth";
import { useAuthStore } from "@/stores/auth.store";

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();

  return (
    <RoleGuard roles={["TEACHER_APPLICANT", "TEACHER"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="border-b bg-white dark:border-gray-800 dark:bg-gray-950">
          <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-bold text-primary-600">
              40Study
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-gray-600 sm:inline dark:text-gray-300">{user?.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-1 h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-3xl p-4 md:p-6">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
