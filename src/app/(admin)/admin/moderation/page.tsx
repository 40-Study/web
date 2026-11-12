"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAllReports, useUpdateReportStatus } from "@/hooks/queries/use-reports";
import type { Report, ReportModerationAction, ReportStatus } from "@/services/report.service";
import { QueryState } from "@/components/common/query-state";
import { formatVnDateTime } from "@/lib/vn-datetime";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { ReportActionDialog } from "./_components/report-action-dialog";
import { ReportTargetLabel } from "./_components/report-target-label";
import { REPORT_ACTION_SPECS, isKnownReportAction } from "./_lib/report-actions";
import { STICKY_ACTION_CELL, STICKY_ACTION_HEAD } from "@/app/(admin)/admin/_lib/sticky-action-column";

// A-P2-5: trước đây có API nghiệp vụ report (POST/GET/PUT/DELETE /api/reports) nhưng KHÔNG có
// trang admin nào để xử lý — chủ trường không có cách nào nhìn thấy report của học viên. Trang
// này dùng đúng contract endpoint đã có ở backend/internal/router/report_router.go, không thêm
// route mới.
//
// Ghi chú phạm vi (đã ghi trong báo cáo QA A-P0-1): GET/PUT /api/reports hiện CHƯA có permission
// gate ở backend — mọi user đã đăng nhập gọi được, không riêng admin. Đó là việc của lane sửa
// backend (đã có báo cáo riêng), KHÔNG thuộc phạm vi lane web này. Trang admin này vẫn nằm sau
// RoleGuard (SYSTEM_ADMIN/ORG_OWNER) ở layout — chỉ admin mới THẤY được UI, dù API bên dưới có
// đang hở với user khác hay không.

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: "Chờ xử lý",
  reviewing: "Đang xem xét",
  resolved: "Đã xử lý",
  dismissed: "Đã từ chối",
};

const REASON_LABEL: Record<string, string> = {
  spam: "Spam",
  inappropriate: "Nội dung không phù hợp",
  copyright: "Vi phạm bản quyền",
  harassment: "Quấy rối",
  other: "Khác",
};

const REPORTED_TYPE_LABEL: Record<string, string> = {
  course: "Khoá học",
  review: "Đánh giá",
  discussion: "Thảo luận",
  user: "Người dùng",
  comment: "Bình luận",
  lesson: "Bài học",
};

type StatusFilter = "ALL" | ReportStatus;

// QA-C-12: cùng định dạng ngày giờ VN với các màn admin khác (không giây).
const formatDate = (iso?: string) => formatVnDateTime(iso);

export default function AdminModerationPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const { data, isLoading, isError, error, refetch } = useAllReports(
    statusFilter === "ALL" ? { page_size: 50 } : { status: statusFilter, page_size: 50 }
  );
  const updateStatus = useUpdateReportStatus();

  const reports = useMemo(() => data?.data ?? [], [data]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ report: Report; status: ReportStatus } | null>(null);
  const [moderationAction, setModerationAction] = useState<ReportModerationAction | null>(null);

  const selected = useMemo(() => reports.find((r) => r.id === selectedId) || null, [reports, selectedId]);
  const availableActions = (selected?.target?.exists ? selected.target.available_actions : []).filter(
    isKnownReportAction,
  );
  // Lối sang trang người dùng chỉ có nghĩa khi đối tượng còn tồn tại (đã xoá thì không có trang để mở).
  const canOpenUserPage = selected?.reported_type === "user" && selected.target?.exists === true;

  const openReport = (r: Report) => {
    setSelectedId(r.id);
    setModerationAction(null);
    setAdminNotes(r.admin_notes || "");
  };

  const doChangeStatus = (status: ReportStatus) => {
    if (!selected) return;
    updateStatus.mutate({ id: selected.id, data: { status, admin_notes: adminNotes || undefined } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Báo cáo vi phạm</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kiểm duyệt báo cáo vi phạm do người dùng gửi (khoá học, đánh giá, thảo luận, người dùng).
          Mở một báo cáo để xem chi tiết và cập nhật trạng thái xử lý.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-3 shadow-sm dark:border-gray-800">
        <div className="flex flex-wrap gap-2">
          {(["pending", "reviewing", "resolved", "dismissed", "ALL"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                statusFilter === s
                  ? "bg-primary-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s === "ALL" ? "Tất cả" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm dark:border-gray-800">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            error={error}
            isEmpty={reports.length === 0}
            emptyTitle="Không có báo cáo nào ở trạng thái này"
            onRetry={() => refetch()}
            className="p-6"
          >
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Đối tượng bị báo cáo</th>
                    <th className="px-4 py-3 text-left">Lý do</th>
                    <th className="px-4 py-3 text-left">Trạng thái</th>
                    <th className="px-4 py-3 text-left">Gửi lúc</th>
                    <th className={`px-4 py-3 text-left ${STICKY_ACTION_HEAD}`}>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map((r) => (
                    <tr key={r.id} className={selected?.id === r.id ? "bg-primary-50/60 dark:bg-primary-900/20" : ""}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{REPORTED_TYPE_LABEL[r.reported_type] ?? r.reported_type}</p>
                        <ReportTargetLabel report={r} />
                      </td>
                      <td className="px-4 py-3">{REASON_LABEL[r.reason] ?? r.reason}</td>
                      <td className="px-4 py-3">{STATUS_LABEL[r.status] ?? r.status}</td>
                      <td className="px-4 py-3">{formatDate(r.created_at)}</td>
                      <td className={`px-4 py-3 ${STICKY_ACTION_CELL}`}>
                        <button
                          onClick={() => openReport(r)}
                          className="rounded bg-muted px-2 py-1 text-xs hover:bg-muted-foreground/20"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </QueryState>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm dark:border-gray-800">
          <h2 className="mb-3 text-base font-semibold">Chi tiết báo cáo</h2>
          {selected ? (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Đối tượng:</span>{" "}
                <ReportTargetLabel report={selected} />
              </p>
              <p><span className="text-muted-foreground">Loại:</span> {REPORTED_TYPE_LABEL[selected.reported_type] ?? selected.reported_type}</p>
              <p className="break-all"><span className="text-muted-foreground">ID đối tượng:</span> {selected.reported_id}</p>
              <p><span className="text-muted-foreground">Lý do:</span> {REASON_LABEL[selected.reason] ?? selected.reason}</p>
              <p><span className="text-muted-foreground">Mô tả:</span> {selected.description || "-"}</p>
              <p><span className="text-muted-foreground">Trạng thái hiện tại:</span> {STATUS_LABEL[selected.status] ?? selected.status}</p>
              <p><span className="text-muted-foreground">Gửi lúc:</span> {formatDate(selected.created_at)}</p>

              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Ghi chú admin</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="h-20 w-full rounded border border-border px-2 py-1.5 text-sm dark:bg-gray-900"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updateStatus.isPending || selected.status === "reviewing"}
                  onClick={() => doChangeStatus("reviewing")}
                >
                  Đang xem xét
                </Button>
                <Button
                  size="sm"
                  disabled={updateStatus.isPending}
                  onClick={() => setConfirmAction({ report: selected, status: "resolved" })}
                >
                  Đánh dấu đã xử lý
                </Button>
                <Button
                  size="sm"
                  variant="destructiveGhost"
                  disabled={updateStatus.isPending}
                  onClick={() => setConfirmAction({ report: selected, status: "dismissed" })}
                >
                  Từ chối báo cáo
                </Button>
              </div>

              {(availableActions.length > 0 || canOpenUserPage) && (
                <div className="space-y-2 border-t pt-3 dark:border-gray-800">
                  <p className="text-xs font-medium text-foreground">Xử lý đối tượng</p>
                  <div className="flex flex-wrap gap-2">
                    {availableActions.map((action) => (
                      <Button
                        key={action}
                        size="sm"
                        variant={action === "unhide_discussion" ? "outline" : "destructive"}
                        onClick={() => setModerationAction(action)}
                      >
                        {REPORT_ACTION_SPECS[action].button}
                      </Button>
                    ))}
                    {canOpenUserPage && (
                      <Link
                        href={`/admin/users/${selected.reported_id}`}
                        className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50 dark:border-gray-700"
                      >
                        Mở trang người dùng để khoá tài khoản
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chọn một báo cáo để xem chi tiết.</p>
          )}
        </div>
      </div>

      {selected && moderationAction && (
        <ReportActionDialog report={selected} action={moderationAction} onClose={() => setModerationAction(null)} />
      )}

      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogTitle>
            {confirmAction?.status === "resolved" ? "Đánh dấu báo cáo đã xử lý?" : "Từ chối báo cáo này?"}
          </DialogTitle>
          <DialogDescription>
            Trạng thái sẽ đổi thành &quot;{confirmAction ? STATUS_LABEL[confirmAction.status] : ""}&quot;. Ghi chú
            admin hiện tại sẽ được lưu kèm theo.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Huỷ
            </Button>
            <Button
              variant={confirmAction?.status === "dismissed" ? "destructive" : "default"}
              onClick={() => {
                if (confirmAction) doChangeStatus(confirmAction.status);
                setConfirmAction(null);
              }}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
