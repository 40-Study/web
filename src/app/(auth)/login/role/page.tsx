"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { RoleCard } from "@/components/auth/role-card";
import type { RoleType } from "@/components/auth/role-card";
import { Button } from "@/components/ui/button";
import { AUTH_ROUTES, getRoleHomeRoute, normalizeRole } from "@/lib/routes";
import { useAuthStore } from "@/stores";
import { useSelectProfile } from "@/hooks/queries/use-auth";
import type { SystemRole } from "@/services/auth.service";

// Roles that require children selection instead of org selection
const CHILDREN_ROLES: RoleType[] = ["parent"];

export default function LoginRolePage() {
  const router = useRouter();
  const { systemRoles, setActiveRole } = useAuthStore();
  const selectProfile = useSelectProfile();
  const [selectedRole, setSelectedRole] = useState<SystemRole | null>(
    systemRoles.length > 0 ? systemRoles[0] : null
  );

  const handleContinue = async () => {
    if (!selectedRole) return;

    try {
      const response = await selectProfile.mutateAsync(selectedRole.id);
      const normalizedRole = normalizeRole(selectedRole.name);
      setActiveRole(normalizedRole);

      const roleType = selectedRole.name.toLowerCase() as RoleType;

      // Parent role → children selection
      if (CHILDREN_ROLES.includes(roleType)) {
        router.push(AUTH_ROUTES.LOGIN_CHILDREN);
        return;
      }

      // If organizations returned → org selection (needed to get access_token)
      const orgs = response?.data?.organizations || [];
      if (orgs.length > 0) {
        router.push(AUTH_ROUTES.LOGIN_ORGANIZATION);
        return;
      }

      // No org needed → redirect directly to role home
      router.push(getRoleHomeRoute(normalizedRole));
    } catch (error) {
      console.error("Failed to select profile:", error);
    }
  };

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
        Đăng nhập với tư cách:
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">Chọn vai trò của bạn để tiếp tục</p>

      <div className="space-y-3" role="radiogroup" aria-label="Chọn vai trò">
        {systemRoles.length > 0 ? (
          systemRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role.name.toLowerCase() as RoleType}
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
        disabled={!selectedRole || selectProfile.isPending} 
        className="mt-6 h-12 w-full"
      >
        {selectProfile.isPending ? "Đang xử lý..." : "Tiếp tục"}
      </Button>
    </AuthCard>
  );
}
