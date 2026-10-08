"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAllReports, useUpdateReportStatus } from "@/hooks/queries/use-reports";
import type { Report, ReportStatus } from "@/services/report.service";
import { QueryState } from "@/components/common/query-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { reportTargetKey, useReportTargetMeta } from "./_lib/report-target";

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

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString("vi-VN") : "-");

export default function AdminModerationPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const { data, isLoading, isError, error, refetch } = useAllReports(
    statusFilter === "ALL" ? { page_size: 50 } : { status: statusFilter, page_size: 50 }
  );
  const updateStatus = useUpdateReportStatus();

  const reports = useMemo(() => data?.data ?? [], [data]);
  const targetMeta = useReportTargetMeta(reports);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ report: Report; status: ReportStatus } | null>(null);

  const selected = useMemo(() => reports.find((r) => r.id === selectedId) || null, [reports, selectedId]);
  const selectedTarget = selected
    ? targetMeta.get(reportTargetKey(selected.reported_type, selected.reported_id))
    : undefined;

  const openReport = (r: Report) => {
    setSelectedId(r.id);
    setAdminNotes(r.admin_notes || "");
  };

  const doChangeStatus = (status: ReportStatus) => {
    if (!selected) return;
    updateStatus.mutate({ id: selected.id, data: { status, admin_notes: adminNotes || undefined } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Báo cáo vi phạm</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Kiểm duyệt báo cáo vi phạm do người dùng gửi (khoá học, đánh giá, thảo luận, người dùng).
          Mở một báo cáo để xem chi tiết và cập nhật trạng thái xử lý.
        </p>
      </div>

      <section className="rounded-xl border bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-wrap gap-2">
          {(["pending", "reviewing", "resolved", "dismissed", "ALL"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                statusFilter === s
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {s === "ALL" ? "Tất cả" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
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
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left">Đối tượng bị báo cáo</th>
                    <th className="px-4 py-3 text-left">Lý do</th>
                    <th className="px-4 py-3 text-left">Trạng thái</th>
                    <th className="px-4 py-3 text-left">Gửi lúc</th>
                    <th className="px-4 py-3 text-left">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {reports.map((r) => (
                    <tr key={r.id} className={selected?.id === r.id ? "bg-primary-50/60 dark:bg-primary-900/20" : ""}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{REPORTED_TYPE_LABEL[r.reported_type] ?? r.reported_type}</p>
                        {(() => {
                          const meta = targetMeta.get(reportTargetKey(r.reported_type, r.reported_id));
                          if (meta?.name) {
                            return meta.href ? (
                              <Link href={meta.href} className="text-primary-700 hover:underline dark:text-primary-400">
                                {meta.name}
                              </Link>
                            ) : (
                              <p className="text-xs text-gray-600 dark:text-gray-300">{meta.name}</p>
                            );
                          }
                          return (
                            <p className="break-all font-mono text-[11px] text-gray-400">{r.reported_id}</p>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">{REASON_LABEL[r.reason] ?? r.reason}</td>
                      <td className="px-4 py-3">{STATUS_LABEL[r.status] ?? r.status}</td>
                      <td className="px-4 py-3">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openReport(r)}
                          className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-800"
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

        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-3 text-base font-semibold">Chi tiết báo cáo</h2>
          {selected ? (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-gray-500">Đối tượng:</span>{" "}
                {selectedTarget?.name ? (
                  selectedTarget.href ? (
                    <Link href={selectedTarget.href} className="text-primary-700 hover:underline dark:text-primary-400">
                      {selectedTarget.name}
                    </Link>
                  ) : (
                    selectedTarget.name
                  )
                ) : (
                  REPORTED_TYPE_LABEL[selected.reported_type] ?? selected.reported_type
                )}
              </p>
              <p><span className="text-gray-500">Loại:</span> {REPORTED_TYPE_LABEL[selected.reported_type] ?? selected.reported_type}</p>
              <p className="break-all"><span className="text-gray-500">ID đối tượng:</span> {selected.reported_id}</p>
              <p><span className="text-gray-500">Lý do:</span> {REASON_LABEL[selected.reason] ?? selected.reason}</p>
              <p><span className="text-gray-500">Mô tả:</span> {selected.description || "-"}</p>
              <p><span className="text-gray-500">Trạng thái hiện tại:</span> {STATUS_LABEL[selected.status] ?? selected.status}</p>
              <p><span className="text-gray-500">Gửi lúc:</span> {formatDate(selected.created_at)}</p>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Ghi chú admin</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="h-20 w-full rounded border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
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
            </div>
          ) : (
            <p className="text-sm text-gray-500">Chọn một báo cáo để xem chi tiết.</p>
          )}
        </div>
      </div>

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
              Hủy
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
