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
 *
 * Lối ra: (app)/layout không nhận TEACHER_APPLICANT, nên học viên vừa nộp đơn sẽ kẹt ở đây nếu
 * chỉ có nút Đăng xuất. Nếu user còn vai trò khác (vd STUDENT/PARENT), hiện nút quay lại vai trò
 * đó qua useSwitchRole (tự bootstrap phiên + điều hướng về trang chủ của vai trò).
 */

import Link from "next/link";
import { LogOut, Undo2 } from "lucide-react";
import { RoleGuard } from "@/components/guards/role-guard";
import { Button } from "@/components/ui/button";
import { useLogout, useSwitchRole } from "@/hooks/queries/use-auth";
import { siteConfig } from "@/lib/constants";
import { getSystemRoleLabel } from "@/lib/role-labels";
import { normalizeRole } from "@/lib/routes";
import type { UnifiedRole } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

const APPLICANT_ROLE = "TEACHER_APPLICANT";

/** Vai trò đầu tiên (khác ứng viên và khác vai đang dùng) để quay về; null = không có lối ra. */
function findFallbackRole(roles: UnifiedRole[], activeRole: string | null): UnifiedRole | null {
  const active = normalizeRole(activeRole);
  return (
    roles.find((r) => {
      const name = normalizeRole(r.role_name);
      return name !== APPLICANT_ROLE && name !== active;
    }) ?? null
  );
}

function roleLabel(role: UnifiedRole): string {
  if (role.type === "organization") return role.display_name || role.role_name;
  return getSystemRoleLabel(normalizeRole(role.role_name) ?? role.role_name).toLowerCase();
}

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const roles = useAuthStore((s) => s.roles);
  const activeRole = useAuthStore((s) => s.activeRole);
  const logoutMutation = useLogout();
  const switchRole = useSwitchRole();
  const fallbackRole = findFallbackRole(roles ?? [], activeRole);

  const handleSwitchBack = () => {
    if (!fallbackRole) return;
    // Lỗi đã được useSwitchRole toast ở onError — dùng mutate để không có promise bị bỏ rơi.
    switchRole.mutate({
      role_id: fallbackRole.id,
      role_type: fallbackRole.type,
      organization_id: fallbackRole.organization_id || undefined,
    });
  };

  return (
    <RoleGuard roles={["TEACHER_APPLICANT", "TEACHER"]}>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
            <Link href="/" className="font-heading text-lg font-bold text-primary-600 dark:text-primary-400">
              {siteConfig.name}
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-muted-foreground sm:inline">{user?.name}</span>
              {fallbackRole && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchBack}
                  disabled={switchRole.isPending}
                  data-testid="applicant-switch-back"
                >
                  <Undo2 className="mr-1 h-4 w-4" />
                  Quay lại vai trò {roleLabel(fallbackRole)}
                </Button>
              )}
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
