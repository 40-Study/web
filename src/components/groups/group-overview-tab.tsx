"use client";

import { Card } from "@/components/ui/card";
import type { Group } from "@/services/group.service";
import { PRIVACY_DESCRIPTIONS, TYPE_LABELS, formatVnDate, roleLabel } from "./group-labels";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export function GroupOverviewTab({ group }: { group: Group }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-5 md:col-span-2">
        <h2 className="mb-2 font-semibold">Giới thiệu</h2>
        {group.description ? (
          <p className="whitespace-pre-line break-words text-sm text-muted-foreground">{group.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Nhóm chưa có mô tả.</p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 font-semibold">Thông tin nhóm</h2>
        <dl className="divide-y">
          <InfoRow label="Loại nhóm" value={TYPE_LABELS[group.type] ?? group.type} />
          <InfoRow label="Quyền riêng tư" value={PRIVACY_DESCRIPTIONS[group.privacy] ?? group.privacy} />
          <InfoRow label="Thành viên" value={`${group.member_count}/${group.max_members}`} />
          {formatVnDate(group.created_at) && <InfoRow label="Ngày tạo" value={formatVnDate(group.created_at)} />}
          {group.my_role && <InfoRow label="Vai trò của bạn" value={roleLabel(group.my_role)} />}
        </dl>
      </Card>
    </div>
  );
}
