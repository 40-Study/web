"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { RoleCard } from "@/components/auth/role-card";
import type { RoleType } from "@/components/auth/role-card";
import { Button } from "@/components/ui/button";
import { AUTH_ROUTES, getRoleHomeRoute, normalizeRole } from "@/lib/routes";
import { useAuthStore } from "@/stores";
import { useSelectRole } from "@/hooks/queries/use-auth";
import type { UnifiedRole } from "@/services/auth.service";

/** Map backend role_name to RoleCard display type */
function toRoleType(role: UnifiedRole): RoleType {
  const name = role.role_name.toLowerCase();
  if (name.includes("student")) return "student";
  if (name.includes("teacher")) return "teacher";
  if (name.includes("parent")) return "parent";
  if (name.includes("admin") || name.includes("owner")) return "admin";
  return "student";
}

export default function LoginRolePage() {
  const router = useRouter();
  const { roles, setActiveRole } = useAuthStore();
  const selectRole = useSelectRole();
  const [selectedRole, setSelectedRole] = useState<UnifiedRole | null>(
    roles.length > 0 ? roles[0] : null
  );

  const handleContinue = async () => {
    if (!selectedRole) return;

    try {
      const response = await selectRole.mutateAsync(selectedRole);

      if (response.data.completed) {
        // Login complete → redirect to role home
        router.push(getRoleHomeRoute(normalizeRole(selectedRole.role_name)));
      } else if (response.data.requires_org_selection) {
        // Need org selection next
        router.push(AUTH_ROUTES.LOGIN_ORGANIZATION);
      } else {
        // Fallback: redirect to role home
        router.push(getRoleHomeRoute(normalizeRole(selectedRole.role_name)));
      }
    } catch {
      // Error handled by hook
    }
  };

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
        Đăng nhập với tư cách:
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">Chọn vai trò của bạn để tiếp tục</p>

      <div className="space-y-3" role="radiogroup" aria-label="Chọn vai trò">
        {roles.length > 0 ? (
          roles.map((role) => (
            <RoleCard
              key={role.id}
              role={toRoleType(role)}
              label={role.display_name}
              selected={selectedRole?.id === role.id}
              onClick={() => setSelectedRole(role)}
            />
          ))
        ) : (
          <p className="text-center text-sm text-gray-500">
            Không tìm thấy vai trò nào. Vui lòng đăng nhập lại.
          </p>
        )}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!selectedRole || selectRole.isPending}
        className="mt-6 h-12 w-full"
      >
        {selectRole.isPending ? "Đang xử lý..." : "Tiếp tục"}
      </Button>
    </AuthCard>
  );
}
