"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyRoles, useSwitchRole } from "@/hooks/queries/use-auth";
import { getSystemRoleLabel } from "@/lib/role-labels";
import { resolveHomeRoute } from "@/lib/role-resolution";
import { normalizeRole } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Lối vào khu /org cho người đang dùng vai KHÁC chủ tổ chức (QA-B-27). Trước đây RoleGuard đẩy thẳng sang /403
 * "Không có quyền truy cập" nên chủ tổ chức đang ở vai Giảng viên tưởng mình bị chặn. Nay: có vai Chủ tổ chức thì
 * chuyển vai ngay tại đây (token mới mang active_org_id mà mọi API /org cần); chưa có thì nói rõ lý do và ai cấp.
 */
export function OrgAreaGate() {
  const { activeRole, roles: storeRoles } = useAuthStore();
  const myRoles = useMyRoles();
  const switchRole = useSwitchRole();
  const ownerRoles = (myRoles.data?.roles ?? storeRoles ?? []).filter((r) => normalizeRole(r.role_name) === "ORG_OWNER");
  const currentLabel = getSystemRoleLabel(normalizeRole(activeRole) ?? "");
  const homeHref = resolveHomeRoute(activeRole, storeRoles);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <Building2 className="mx-auto h-10 w-10 text-primary-600" aria-hidden="true" />
        <h1 className="mt-3 font-heading text-xl font-semibold text-foreground">Khu quản lý tổ chức</h1>
        {myRoles.isLoading && ownerRoles.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Đang kiểm tra vai trò của bạn…</p>
        ) : ownerRoles.length > 0 ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Bạn đang dùng vai <strong className="text-foreground">{currentLabel}</strong>. Chọn tổ chức để chuyển sang vai
              Chủ tổ chức.
            </p>
            <div className="mt-4 space-y-2">
              {ownerRoles.map((role) => (
                <Button
                  key={`${role.id}-${role.organization_id ?? ""}`}
                  className="w-full"
                  disabled={switchRole.isPending}
                  isLoading={switchRole.isPending && switchRole.variables?.organization_id === role.organization_id}
                  onClick={() =>
                    switchRole.mutate({
                      role_id: role.id,
                      role_type: role.type,
                      organization_id: role.organization_id || undefined,
                    })
                  }
                >
                  Chủ tổ chức · {role.organization_name?.trim() || "Tổ chức"}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Tài khoản của bạn chưa là chủ của tổ chức nào. Khi quản trị hệ thống thêm bạn vào một tổ chức với vai Chủ tổ
            chức, bạn sẽ vào được khu này.
          </p>
        )}
        <Link href={homeHref} className="mt-4 inline-block text-sm font-medium text-primary-600 hover:underline">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
