"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Loader2, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChildren } from "@/hooks/queries/use-auth";
import { useUnlinkChild } from "@/hooks/queries/use-parent-link";
import type { Child } from "@/services/auth.service";
import { ConfirmUnlinkDialog } from "./confirm-unlink-dialog";

/** Danh sách con đã liên kết của phụ huynh: mở trang chi tiết, hoặc huỷ liên kết (có xác nhận). */
export function LinkedChildrenList() {
  const { data: childrenData, isLoading } = useChildren();
  const children = childrenData?.children ?? [];
  const unlink = useUnlinkChild();
  const [target, setTarget] = useState<Child | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-100 p-10 text-center">
        <div className="max-w-md mx-auto">
          <div className="relative w-20 h-20 mx-auto mb-5 bg-primary-50 rounded-full flex items-center justify-center">
            <Users className="w-9 h-9 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa liên kết với con nào</h3>
          <p className="text-slate-500 leading-relaxed">
            Gửi yêu cầu liên kết theo email của con ở mục phía trên, hoặc chấp nhận lời mời con đã gửi cho bạn.
          </p>
        </div>
      </div>
    );
  }

  const targetName = target ? target.full_name || target.username : "";

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        {children.map((child) => {
          const displayName = child.full_name || child.username;
          return (
            <div key={child.id} className="bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-md transition-all">
              <Link href={`/parent/children/${child.id}`} className="group flex items-center gap-4 p-5 pb-3">
                {child.avatar_url ? (
                  <Image src={child.avatar_url} alt={displayName} width={48} height={48} className="rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <span className="text-lg font-medium text-primary-700">{displayName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate group-hover:text-primary-600">{displayName}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    Đã liên kết
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 shrink-0" />
              </Link>
              <div className="px-5 pb-4 flex justify-end">
                <Button size="sm" variant="destructiveGhost" onClick={() => setTarget(child)}>
                  Huỷ liên kết
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <ConfirmUnlinkDialog
        open={!!target}
        onOpenChange={(open) => !open && setTarget(null)}
        name={targetName}
        description="Bạn sẽ không xem được tiến độ học tập của con nữa. Muốn liên kết lại, bạn cần gửi yêu cầu mới và con xác nhận."
        isPending={unlink.isPending}
        onConfirm={() => target && unlink.mutate(target.id, { onSuccess: () => setTarget(null) })}
      />
    </>
  );
}
