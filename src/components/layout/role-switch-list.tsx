"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useMyRoles, useSwitchRole } from "@/hooks/queries/use-auth";
import { getSystemRoleLabel } from "@/lib/role-labels";
import { isSelectableRole } from "@/lib/role-resolution";

interface RoleSwitchListProps {
  /** Gọi ngay khi người dùng bấm một vai (đóng sheet/menu chứa danh sách). */
  onSwitch?: () => void;
  className?: string;
}

/**
 * Danh sách chuyển vai trò dùng ở nơi không có menu avatar (bottom-nav mobile, trang 403).
 * Chỉ liệt kê vai web có khu vực thật (`isSelectableRole`): vai tuỳ biến của tổ chức không phải đích riêng (Q3-05).
 */
export function RoleSwitchList({ onSwitch, className }: RoleSwitchListProps) {
  const { roles, activeUnifiedRole } = useAuthStore();
  const { data: myRoles } = useMyRoles();
  const switchRole = useSwitchRole();
  const selectable = (myRoles?.roles ?? roles ?? []).filter(isSelectableRole);

  // Chỉ hiện khi có gì để chuyển: một vai duy nhất thì danh sách chỉ là nhiễu.
  if (selectable.length < 2) return null;

  return (
    <div className={cn("space-y-1", className)} role="group" aria-label="Chuyển vai trò">
      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Chuyển vai trò
      </p>
      {selectable.map((role) => {
        const isActive = activeUnifiedRole?.id === role.id;
        const orgName = role.organization_name?.trim();
        return (
          <button
            key={role.id}
            type="button"
            disabled={isActive || switchRole.isPending}
            aria-pressed={isActive}
            onClick={() => {
              switchRole.mutate({
                role_id: role.id,
                role_type: role.type,
                organization_id: role.organization_id || undefined,
              });
              onSwitch?.();
            }}
            className={cn(
              "flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors disabled:opacity-60",
              isActive ? "bg-primary-50 dark:bg-primary-900/30" : "hover:bg-muted"
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-foreground">{getSystemRoleLabel(role.role_name)}</span>
              {orgName && <span className="block truncate text-xs text-muted-foreground">{orgName}</span>}
            </span>
            {isActive && <Check className="h-4 w-4 shrink-0 text-primary-600" aria-label="Đang dùng" />}
          </button>
        );
      })}
    </div>
  );
}
