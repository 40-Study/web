"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { RoleCard } from "@/components/auth/role-card";
import type { RoleType } from "@/components/auth/role-card";
import { Button } from "@/components/ui/button";
import { AUTH_ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/stores";
import { useSelectRole } from "@/hooks/queries/use-auth";
import { authService } from "@/services/auth.service";
import type { UnifiedRole } from "@/stores/auth.store";
import type { SystemRoleOption } from "@/services/auth.service";

export default function LoginRolePage() {
  const router = useRouter();
  const { roles, sessionToken, token } = useAuthStore();
  const selectRole = useSelectRole();
  const [selectedRole, setSelectedRole] = useState<UnifiedRole | null>(
    roles.length > 0 ? roles[0] : null
  );
  const [showAddRole, setShowAddRole] = useState(false);
  const [allSystemRoles, setAllSystemRoles] = useState<SystemRoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const hasRoles = roles.length > 0;

  // User chưa có role (0 roles) → fetch all available system roles để chọn đăng ký
  useEffect(() => {
    if (!hasRoles) {
      fetchAllSystemRoles();
    }
  }, [hasRoles]);

  // Không có session_token VÀ không có token → chưa login, redirect về login
  // (Khi selectRole thành công, sessionToken=null nhưng token đã được set → không redirect)
  useEffect(() => {
    if (!sessionToken && !token) {
      router.push(AUTH_ROUTES.LOGIN);
    }
  }, [sessionToken, token, router]);

  async function fetchAllSystemRoles() {
    setLoadingRoles(true);
    try {
      const data = await authService.getAllSystemRoles();
      setAllSystemRoles(data.system_roles || []);
    } catch {
      setAllSystemRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }

  const handleAddRole = () => {
    setShowAddRole(true);
    setSelectedRole(null);
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

  // State cho mode chọn system role mới (khi user chưa có role)
  const [selectedSystemRole, setSelectedSystemRole] = useState<SystemRoleOption | null>(null);

  // Danh sách hiển thị
  const isNewRoleMode = !hasRoles || showAddRole;

  const title = !hasRoles
    ? "Chọn vai trò của bạn"
    : showAddRole
      ? "Thêm vai trò mới"
      : "Đăng nhập với tư cách:";
  const subtitle = !hasRoles
    ? "Chọn vai trò để bắt đầu sử dụng hệ thống"
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
                role={role.name.toLowerCase() as RoleType}
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
              role={role.role_name.toLowerCase() as RoleType}
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

        {/* Nút thêm role - chỉ hiện khi đã có role và không đang ở mode thêm */}
        {hasRoles && !showAddRole && (
          <Button variant="outline" onClick={handleAddRole} className="h-12 w-full">
            + Thêm vai trò mới
          </Button>
        )}

        {/* Nút quay lại - khi đang ở mode thêm role */}
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
