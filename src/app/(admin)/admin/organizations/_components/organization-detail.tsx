"use client";

import { Badge } from "@/components/ui/badge";
import { useOrgMembers } from "@/hooks/queries/use-org-area";
import { formatVnDateTime } from "@/lib/vn-datetime";
import type { Organization } from "@/services/organization.service";

const ORG_STATUS_LABEL: Record<string, string> = { active: "Đang hoạt động", inactive: "Tạm ngưng" };

/** Nhãn trạng thái tổ chức; giá trị lạ hiện nguyên văn thay vì đoán nghĩa. */
export function OrgStatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <Badge variant={status === "active" ? "success" : "secondary"} className="whitespace-nowrap">
      {ORG_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

/**
 * Chi tiết tổ chức đang chọn (QA-C-06): bỏ UUID thô, thêm mô tả, trạng thái, chủ tổ chức và số thành viên.
 * Chủ tổ chức lấy từ cùng query thành viên mà OrgMembersPanel bên dưới dùng (chung query key), không gọi thêm API.
 */
export function OrganizationDetail({ org }: { org: Organization }) {
  const members = useOrgMembers(org.id);
  const owners = (members.data ?? []).filter((m) => m.roles.includes("ORG_OWNER"));

  return (
    <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[8rem_1fr]">
      <dt className="text-muted-foreground">Tên</dt>
      <dd className="font-medium text-foreground">{org.name}</dd>
      <dt className="text-muted-foreground">Trạng thái</dt>
      <dd>
        <OrgStatusBadge status={org.status} />
      </dd>
      <dt className="text-muted-foreground">Mô tả</dt>
      <dd className="whitespace-pre-line text-foreground">{org.description?.trim() || "Chưa có mô tả"}</dd>
      <dt className="text-muted-foreground">Chủ tổ chức</dt>
      <dd className="text-foreground">
        {members.isLoading
          ? "Đang tải…"
          : members.isError
            ? "Không tải được"
            : owners.length > 0
              ? owners.map((o) => o.name).join(", ")
              : "Chưa có chủ tổ chức"}
      </dd>
      <dt className="text-muted-foreground">Thành viên</dt>
      <dd className="text-foreground">{members.data ? `${members.data.length} người` : "—"}</dd>
      {org.created_at && (
        <>
          <dt className="text-muted-foreground">Tạo lúc</dt>
          <dd className="text-foreground">{formatVnDateTime(org.created_at)}</dd>
        </>
      )}
    </dl>
  );
}
