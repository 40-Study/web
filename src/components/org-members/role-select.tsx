"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getOrgRoleLabel } from "@/lib/role-labels";
import type { OrgRoleListItem } from "@/services/role.service";

interface RoleSelectProps {
  roles: OrgRoleListItem[];
  value: string;
  onChange: (roleId: string) => void;
  ariaLabel: string;
  disabled?: boolean;
}

/** Ô chọn vai trò tổ chức: hiện nhãn dễ đọc (getOrgRoleLabel), giữ mã gốc ở `title` của từng mục. */
export function RoleSelect({ roles, value, onChange, ariaLabel, disabled }: RoleSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={ariaLabel} disabled={disabled}>
        <SelectValue placeholder="Chọn vai trò" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.id} value={role.id} title={role.name}>
            {getOrgRoleLabel(role.name)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
