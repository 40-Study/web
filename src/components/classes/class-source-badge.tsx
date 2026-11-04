"use client";

import { useMemo } from "react";
import { Building2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { organizationsFromRoles } from "@/components/teacher/class-organization-field";
import { useMyRoles } from "@/hooks/queries/use-auth";

/** Tên hiển thị của nguồn lớp: tên tổ chức, hoặc "Cá nhân" khi lớp không thuộc tổ chức nào. */
export function classSourceLabel(organizationId: string | null | undefined, organizationNames: Map<string, string>): string {
  if (!organizationId) return "Cá nhân";
  // API lớp chỉ trả organization_id; tên lấy từ vai trò của người dùng. Không tra được (đã rời tổ chức) thì nói chung "Tổ chức".
  return organizationNames.get(organizationId) ?? "Tổ chức";
}

/** Nhãn lớp cá nhân / lớp thuộc tổ chức, để giảng viên thuộc nhiều tổ chức phân biệt được nguồn của từng lớp. */
export function ClassSourceBadge({ organizationId }: { organizationId?: string | null }) {
  const { data } = useMyRoles();
  const names = useMemo(() => new Map(organizationsFromRoles(data?.roles).map((o) => [o.id, o.name])), [data]);
  const Icon = organizationId ? Building2 : User;

  return (
    <Badge variant={organizationId ? "secondary" : "outline"} className="gap-1">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {classSourceLabel(organizationId, names)}
    </Badge>
  );
}
