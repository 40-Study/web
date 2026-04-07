"use client";

import { useState, useEffect } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { RoleCard } from "@/components/auth/role-card";
import type { RoleType } from "@/components/auth/role-card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import { useSelectRole } from "@/hooks/queries/use-auth";
import { authService } from "@/services/auth.service";
import type { UnifiedRole, SystemRoleOption } from "@/services/auth.service";

/** Map backend role_name to RoleCard display type */
function toRoleType(roleName: string): RoleType {
  const name = roleName.toLowerCase();
  if (name.includes("student")) return "student";
  if (name.includes("teacher")) return "teacher";
  if (name.includes("parent")) return "parent";
  if (name.includes("admin") || name.includes("owner")) return "admin";
  return "student";
}

export default function LoginRolePage() {
  const { roles, sessionToken, isAuthenticated } = useAuthStore();
  const selectRole = useSelectRole();
  const [selectedRole, setSelectedRole] = useState<UnifiedRole | null>(null);
  const [showAddRole, setShowAddRole] = useState(false);
  const [allSystemRoles, setAllSystemRoles] = useState<SystemRoleOption[]>([]);
  const [selectedSystemRole, setSelectedSystemRole] = useState<SystemRoleOption | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const hasRoles = roles.length > 0;

  // Tự fetch system roles khi user chưa có role
  useEffect(() => {
    if (!hasRoles) {
      fetchAllSystemRoles();
    }
  }, [hasRoles]);

  const fetchAllSystemRoles = async () => {
    setLoadingRoles(true);
    try {
      const data = await authService.getAllSystemRoles();
      setAllSystemRoles(data.system_roles || []);
    } catch {
      // ignore
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleAddRole = () => {
    setShowAddRole(true);
    setSelectedRole(null);
    setSelectedSystemRole(null);
    if (allSystemRoles.length === 0) fetchAllSystemRoles();
  };

  // Roles chưa có (để hiện trong add mode)
  const existingRoleNames = roles.map((r) => r.role_name.toUpperCase());
  const availableNewRoles = allSystemRoles.filter(
    (r) => !existingRoleNames.includes(r.name.toUpperCase())
  );

  const handleContinue = async () => {
    if (!selectedRole && !selectedSystemRole) return;

    if (selectedRole) {
      // Chọn từ unified roles đã có
      selectRole.mutate({
        roleId: selectedRole.id,
        roleType: selectedRole.type,
        organizationId: selectedRole.organization_id,
      });
    } else if (selectedSystemRole) {
      // User chưa có role hoặc thêm role mới → gửi system role ID
      selectRole.mutate({
        roleId: selectedSystemRole.id,
        roleType: "system",
      });
    }
  };

  // Danh sách hiển thị
  const isNewRoleMode = !hasRoles || showAddRole;

  const title = !hasRoles
    ? "Chọn vai trò của bạn"
    : showAddRole
      ? "Thêm vai trò mới"
      : "Đăng nhập với tư cách:";
  const subtitle = !hasRoles
    ? "Chọn vai trò để bắt đầu"
    : showAddRole
      ? "Chọn vai trò bạn muốn thêm"
      : "Chọn vai trò của bạn để tiếp tục";

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mb-6 text-center text-sm text-gray-500">{subtitle}</p>

      <div className="space-y-3" role="radiogroup" aria-label="Chọn vai trò">
        {isNewRoleMode ? (
          // Mode chọn system role mới
          loadingRoles ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
            </div>
          ) : availableNewRoles.length > 0 ? (
            availableNewRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={toRoleType(role.name)}
                selected={selectedSystemRole?.id === role.id}
                onClick={() => {
                  setSelectedSystemRole(role);
                  setSelectedRole(null);
                }}
              />
            ))
          ) : (
            <p className="text-center text-sm text-gray-500">
              {showAddRole ? "Bạn đã có tất cả vai trò." : "Không tìm thấy vai trò nào."}
            </p>
          )
        ) : (
          // Mode chọn unified role đã có
          roles.map((role) => (
            <RoleCard
              key={role.id}
              role={toRoleType(role.role_name)}
              selected={selectedRole?.id === role.id}
              onClick={() => {
                setSelectedRole(role);
                setSelectedSystemRole(null);
              }}
              label={role.display_name}
              subtitle={
                role.type === "organization" && role.organization_name
                  ? role.organization_name
                  : undefined
              }
            />
          ))
        )}
      </div>

      <div className="mt-6 space-y-3">
        <Button
          onClick={handleContinue}
          disabled={(!selectedRole && !selectedSystemRole) || selectRole.isPending}
          className="h-12 w-full"
        >
          {selectRole.isPending ? "Đang xử lý..." : "Tiếp tục"}
        </Button>

        {hasRoles && !showAddRole && (
          <Button variant="outline" onClick={handleAddRole} className="h-12 w-full">
            + Thêm vai trò mới
          </Button>
        )}
        {showAddRole && (
          <Button
            variant="outline"
            onClick={() => {
              setShowAddRole(false);
              setSelectedSystemRole(null);
              setSelectedRole(roles[0] || null);
            }}
            className="h-12 w-full"
          >
            Quay lại chọn vai trò
          </Button>
        )}
      </div>
    </AuthCard>
  );
}
