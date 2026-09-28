"use client";

import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIncomingLinkRequests, useRespondLinkRequest } from "@/hooks/queries/use-parent-link";
import { RELATIONSHIP_OPTIONS } from "./link-child-form";
import { FamilyLoadError } from "./family-load-error";

const relationshipLabel = (value: string) =>
  RELATIONSHIP_OPTIONS.find((o) => o.value === value)?.label ?? value;

/**
 * Học sinh xem yêu cầu liên kết do phụ huynh gửi và tự quyết định (Q4). Chỉ khi bấm "Xác nhận"
 * phụ huynh mới xem được tiến độ; không hiện gì khi không có yêu cầu đang chờ.
 */
export function IncomingLinkRequestsCard({ className }: { className?: string }) {
  const { data: requests = [], isError, refetch } = useIncomingLinkRequests();
  const respond = useRespondLinkRequest();

  if (isError) {
    return <FamilyLoadError className={className} what="yêu cầu liên kết từ phụ huynh" onRetry={() => refetch()} />;
  }
  if (requests.length === 0) return null;

  return (
    <div className={className}>
      <div className="bg-white rounded-2xl border border-amber-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-semibold text-slate-900">Yêu cầu liên kết từ phụ huynh</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Khi bạn xác nhận, người này xem được tiến độ học tập, điểm số và điểm danh của bạn. Chỉ xác nhận nếu đúng là phụ huynh của bạn.
        </p>
        <ul className="space-y-3">
          {requests.map((r) => {
            const name = r.parent ? r.parent.full_name || r.parent.username : "Phụ huynh";
            return (
              <li key={r.id} className="rounded-xl border border-slate-100 p-4">
                <p className="text-sm text-slate-900">
                  <span className="font-medium">{name}</span>{" "}
                  <span className="text-slate-500">({r.parent?.email})</span> muốn liên kết với bạn với vai trò{" "}
                  <span className="font-medium">{relationshipLabel(r.relationship)}</span>.
                </p>
                {r.message && <p className="mt-2 text-sm italic text-slate-600">&ldquo;{r.message}&rdquo;</p>}
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    disabled={respond.isPending}
                    onClick={() => respond.mutate({ requestId: r.id, action: "accept" })}
                  >
                    Xác nhận
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={respond.isPending}
                    onClick={() => respond.mutate({ requestId: r.id, action: "reject" })}
                  >
                    Từ chối
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
