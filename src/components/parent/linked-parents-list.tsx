"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLinkedParents, useUnlinkParent } from "@/hooks/queries/use-parent-link";
import type { LinkedParent } from "@/services/parent-link.service";
import { ConfirmUnlinkDialog } from "./confirm-unlink-dialog";
import { RELATIONSHIP_OPTIONS } from "./link-child-form";
import { FamilyLoadError } from "./family-load-error";

/** Học sinh xem phụ huynh đang liên kết (nguồn thật: quan hệ active) và có thể huỷ liên kết. */
export function LinkedParentsList({ className }: { className?: string }) {
  const { data: parents = [], isError, refetch } = useLinkedParents();
  const unlink = useUnlinkParent();
  const [target, setTarget] = useState<LinkedParent | null>(null);

  if (isError) {
    return <FamilyLoadError className={className} what="danh sách phụ huynh đang liên kết" onRetry={() => refetch()} />;
  }
  if (parents.length === 0) return null;

  const targetName = target ? target.full_name || target.username : "";

  return (
    <div className={className}>
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-semibold text-slate-900">Phụ huynh đang liên kết</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {parents.map((p) => (
            <li key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{p.full_name || p.username}</p>
                <p className="text-xs text-slate-500 truncate">
                  {RELATIONSHIP_OPTIONS.find((o) => o.value === p.relationship)?.label ?? p.relationship} · {p.email}
                </p>
              </div>
              <Button size="sm" variant="destructiveGhost" onClick={() => setTarget(p)}>
                Huỷ liên kết
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <ConfirmUnlinkDialog
        open={!!target}
        onOpenChange={(open) => !open && setTarget(null)}
        name={targetName}
        description="Người này sẽ không xem được tiến độ học tập của bạn nữa. Muốn liên kết lại, phụ huynh cần gửi yêu cầu mới và bạn xác nhận."
        isPending={unlink.isPending}
        onConfirm={() => target && unlink.mutate(target.id, { onSuccess: () => setTarget(null) })}
      />
    </div>
  );
}
