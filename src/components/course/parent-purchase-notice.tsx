"use client";

import { Button } from "@/components/ui/button";
import { useSwitchRole } from "@/hooks/queries/use-auth";
import { normalizeRole } from "@/lib/routes";
import { isSelectableRole } from "@/lib/role-resolution";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Q6-PG-01: dòng thay cho các nút mua khi vai ĐANG CHỌN là Phụ huynh (backend: 403 ERR_PARENT_CANNOT_PURCHASE).
 * Người dùng có cả vai Học viên cần được chỉ đường (chuyển vai); người chỉ có vai Phụ huynh thì dùng tài khoản của con.
 */
export function ParentPurchaseNotice() {
  const studentRole = useAuthStore((s) =>
    (s.roles ?? []).find((r) => isSelectableRole(r) && normalizeRole(r.role_name) === "STUDENT")
  );
  const switchRole = useSwitchRole();

  return (
    <div
      data-testid="parent-cannot-purchase"
      className="space-y-2.5 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600"
    >
      <p>
        {studentRole
          ? "Tài khoản Phụ huynh không thể đăng ký hoặc mua khoá học. Hãy chuyển sang vai Học viên để đăng ký."
          : "Tài khoản Phụ huynh không thể đăng ký hoặc mua khoá học. Hãy dùng tài khoản học viên của con để đăng ký."}
      </p>
      {studentRole && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={switchRole.isPending}
          onClick={() =>
            switchRole.mutate({
              role_id: studentRole.id,
              role_type: studentRole.type,
              organization_id: studentRole.organization_id || undefined,
            })
          }
        >
          Chuyển vai trò
        </Button>
      )}
    </div>
  );
}
