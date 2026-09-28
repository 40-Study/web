"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCancelLinkRequest, useSentLinkRequests } from "@/hooks/queries/use-parent-link";
import type { LinkRequestStatus } from "@/services/parent-link.service";

const STATUS_LABEL: Record<LinkRequestStatus, { text: string; className: string }> = {
  pending: { text: "Đang chờ con xác nhận", className: "bg-amber-50 text-amber-700" },
  accepted: { text: "Con đã xác nhận", className: "bg-emerald-50 text-emerald-700" },
  rejected: { text: "Con đã từ chối", className: "bg-red-50 text-red-700" },
  cancelled: { text: "Đã huỷ", className: "bg-slate-100 text-slate-600" },
};

const formatDay = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

/**
 * Nhãn trạng thái. Yêu cầu đã chốt ghi kèm NGÀY (review #38 W4): "Con đã xác nhận" trần trụi đọc
 * như "đang liên kết" kể cả khi sau đó đã huỷ liên kết; liên kết hiện tại xem ở "Danh sách con".
 */
export function linkRequestStatusText(status: LinkRequestStatus, respondedAt?: string): string {
  const base = STATUS_LABEL[status]?.text ?? status;
  return respondedAt && status !== "pending" ? `${base} ngày ${formatDay(respondedAt)}` : base;
}

/** Danh sách yêu cầu liên kết phụ huynh đã gửi, kèm trạng thái và nút rút yêu cầu đang chờ. */
export function SentLinkRequests() {
  const { data: requests = [], isLoading, isError, refetch } = useSentLinkRequests();
  const cancel = useCancelLinkRequest();

  if (isLoading) {
    return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  }
  if (isError) {
    return (
      <p className="text-sm text-slate-500">
        Không tải được yêu cầu đã gửi.{" "}
        <button type="button" className="text-primary-600 underline" onClick={() => refetch()}>Thử lại</button>
      </p>
    );
  }
  if (requests.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-3">Yêu cầu đã gửi</h2>
      <ul className="divide-y divide-slate-100">
        {requests.map((r) => {
          const status = STATUS_LABEL[r.status] ?? { text: r.status, className: "bg-slate-100 text-slate-600" };
          // Còn chờ thì backend không trả tên học sinh — hiện đúng email phụ huynh đã nhập.
          const who = r.student ? r.student.full_name || r.student.username : r.student_email;
          return (
            <li key={r.id} className="py-3 flex flex-wrap items-center gap-3 justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{who}</p>
                <p className="text-xs text-slate-500 truncate">
                  {r.student ? `${r.student_email} · ` : ""}gửi {formatDay(r.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", status.className)}>
                  {linkRequestStatusText(r.status, r.responded_at)}
                </span>
                {r.status === "pending" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate(r.id)}
                  >
                    Huỷ yêu cầu
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
