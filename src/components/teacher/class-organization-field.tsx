"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { useMyRoles } from "@/hooks/queries/use-auth";
import type { UnifiedRole } from "@/services/auth.service";

export interface OrganizationOption {
  id: string;
  name: string;
}

/**
 * Các tổ chức mà người dùng đang có vai trò (role tổ chức), bỏ trùng theo organization_id.
 * Chỉ để GỢI Ý lựa chọn: backend mới là nơi quyết định (chỉ thành viên active của tổ chức mới gắn được lớp).
 */
export function organizationsFromRoles(roles: UnifiedRole[] | undefined): OrganizationOption[] {
  const seen = new Map<string, OrganizationOption>();
  for (const role of roles ?? []) {
    if (role.type !== "organization" || !role.organization_id) continue;
    if (!seen.has(role.organization_id)) {
      seen.set(role.organization_id, {
        id: role.organization_id,
        name: role.organization_name || role.organization_id,
      });
    }
  }
  return Array.from(seen.values());
}

/**
 * Ô chọn tổ chức khi tạo lớp. Không thuộc tổ chức nào thì không hiện gì (lớp cá nhân, organization_id bỏ trống).
 * `value` rỗng = lớp cá nhân của giảng viên.
 */
export function ClassOrganizationField({
  value,
  onChange,
}: {
  value: string;
  onChange: (organizationId: string) => void;
}) {
  const { data } = useMyRoles();
  const organizations = useMemo(() => organizationsFromRoles(data?.roles), [data]);

  if (organizations.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="class-organization">Tổ chức</Label>
      <select
        id="class-organization"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">Lớp cá nhân (không thuộc tổ chức)</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        Lớp thuộc tổ chức cho phép chủ/quản trị tổ chức chấm điểm. Lớp cá nhân thì không.
      </p>
    </div>
  );
}
