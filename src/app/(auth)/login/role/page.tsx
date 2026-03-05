"use client";

import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { RoleCard } from "@/components/auth/role-card";
import type { RoleType } from "@/components/auth/role-card";
import { Button } from "@/components/ui/button";
import { AUTH_ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/stores";

const roleRoutes: Record<RoleType, string> = {
  student: AUTH_ROUTES.LOGIN_ORGANIZATION,
  parent: AUTH_ROUTES.LOGIN_CHILDREN,
  teacher: AUTH_ROUTES.LOGIN_ORGANIZATION,
  admin: AUTH_ROUTES.LOGIN_ORGANIZATION,
};

export default function LoginRolePage() {
  const router = useRouter();
  const { selectedRole, setSelectedRole } = useAuthStore();

  const handleContinue = () => {
    if (!selectedRole) return;
    router.push(roleRoutes[selectedRole]);
  };

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
        Đăng nhập với tư cách:
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">Chọn vai trò của bạn để tiếp tục</p>

      <div className="space-y-3" role="radiogroup" aria-label="Chọn vai trò">
        {(["student", "parent", "teacher", "admin"] as RoleType[]).map((role) => (
          <RoleCard
            key={role}
            role={role}
            selected={selectedRole === role}
            onClick={() => setSelectedRole(role)}
          />
        ))}
      </div>

      <Button onClick={handleContinue} disabled={!selectedRole} className="mt-6 h-12 w-full">
        Tiếp tục
      </Button>
    </AuthCard>
  );
}
