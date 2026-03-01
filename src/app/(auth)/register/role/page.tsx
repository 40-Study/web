"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { RoleCard } from "@/components/auth/role-card";
import type { RoleType } from "@/components/auth/role-card";
import { Button } from "@/components/ui/button";
import { AUTH_ROUTES } from "@/lib/routes";

export default function RegisterRolePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);

  const handleContinue = () => {
    if (!selectedRole) return;
    router.push(AUTH_ROUTES.OTP);
  };

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
        Bạn sử dụng hệ thống với vai trò
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">Chọn vai trò phù hợp với bạn</p>

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
