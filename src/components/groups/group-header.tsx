"use client";

import { Globe, Lock, EyeOff, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Group } from "@/services/group.service";
import { GroupActions } from "./group-actions";
import { PRIVACY_LABELS, TYPE_LABELS, roleLabel } from "./group-labels";

const PRIVACY_ICONS = { PUBLIC: Globe, PRIVATE: Lock, SECRET: EyeOff } as const;

/** Ảnh bìa, tên, loại + quyền riêng tư, sĩ số, vai của tôi và nút hành động chính. */
export function GroupHeader({ group, onLeft }: { group: Group; onLeft?: () => void }) {
  const PrivacyIcon = PRIVACY_ICONS[group.privacy] ?? Lock;

  return (
    <Card className="overflow-hidden">
      {/* Bìa: dùng background-image thay vì next/image để không phải cấu hình domain ảnh của từng nhóm. */}
      <div
        className="h-28 bg-gradient-to-r from-primary-500 to-primary-700 sm:h-36"
        style={group.cover_url ? { backgroundImage: `url(${group.cover_url})`, backgroundSize: "cover" } : undefined}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="-mt-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-primary/10 sm:-mt-12 sm:h-20 sm:w-20">
            <Users className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="break-words text-xl font-bold sm:text-2xl">{group.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <PrivacyIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {PRIVACY_LABELS[group.privacy] ?? group.privacy}
              </span>
              <span aria-hidden="true">·</span>
              <span>{TYPE_LABELS[group.type] ?? group.type}</span>
              <span aria-hidden="true">·</span>
              <span>
                {group.member_count}/{group.max_members} thành viên
              </span>
              {group.my_role && <Badge variant="outline">{roleLabel(group.my_role)}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <GroupActions group={group} onLeft={onLeft} />
        </div>
      </div>
    </Card>
  );
}
