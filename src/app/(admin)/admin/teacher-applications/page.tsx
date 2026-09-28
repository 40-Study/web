"use client";

import { useState } from "react";
import {
  useAdminTeacherApplications,
  useApproveTeacherApplication,
  useRejectTeacherApplication,
} from "@/hooks/queries/use-teacher-application";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { QueryState } from "@/components/common/query-state";
import { Badge } from "@/components/ui/badge";
import { ApproveConfirmDialog, RejectReasonDialog } from "@/components/admin/review-dialogs";
import { TeacherApplicationDetailDialog } from "@/components/admin/teacher-application-detail-dialog";
import { formatDate } from "@/lib/utils";
import {
  TEACHER_APPROVAL_STATUSES,
  TEACHER_APPROVAL_STATUS_LABEL,
  type TeacherApplicationItem,
  type TeacherApprovalStatus,
} from "@/types/approval";

const LIMIT = 20;

const STATUS_VARIANT: Record<TeacherApprovalStatus, "success" | "warning" | "destructive"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

const ACTION_BTN = "rounded px-2 py-1 text-xs font-medium disabled:opacity-50";

function isApprovalStatus(value: string): value is TeacherApprovalStatus {
  return (TEACHER_APPROVAL_STATUSES as readonly string[]).includes(value);
}

export default function AdminTeacherApplicationsPage() {
  const [status, setStatus] = useState<TeacherApprovalStatus>("pending");
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300);
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState<TeacherApplicationItem | null>(null);
  const [approveTarget, setApproveTarget] = useState<TeacherApplicationItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<TeacherApplicationItem | null>(null);

  const { data, isLoading, isError, error, refetch } = useAdminTeacherApplications({
    status,
    keyword: debouncedKeyword || undefined,
    page,
    limit: LIMIT,
  });
  const approveMutation = useApproveTeacherApplication();
  const rejectMutation = useRejectTeacherApplication();

  const items = data?.items ?? [];

  const onConfirmApprove = () => {
    if (!approveTarget) return;
    approveMutation.mutate(approveTarget.user_id, { onSuccess: () => setApproveTarget(null) });
  };

  const onSubmitReject = (reason: string) => {
    if (!rejectTarget) return;
    rejectMutation.mutate(
      { userId: rejectTarget.user_id, reason },
      { onSuccess: () => setRejectTarget(null) }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Duyệt giáo viên</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Hồ sơ ứng tuyển giảng viên — duyệt để cấp vai trò giảng viên, hoặc từ chối kèm lý do.
        </p>
      </div>

      <section className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo họ tên hoặc email..."
            aria-label="Tìm hồ sơ"
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <select
            value={status}
            aria-label="Lọc theo trạng thái"
            data-testid="application-status-filter"
            onChange={(e) => {
              if (isApprovalStatus(e.target.value)) setStatus(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {TEACHER_APPROVAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TEACHER_APPROVAL_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && items.length === 0}
        emptyTitle="Không có hồ sơ nào"
        emptyDescription={
          status === "pending" ? "Hiện không có hồ sơ nào chờ duyệt." : "Không có hồ sơ khớp bộ lọc."
        }
      >
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left">Họ tên</th>
                  <th className="px-4 py-3 text-left">Chuyên môn</th>
                  <th className="px-4 py-3 text-left">Kinh nghiệm</th>
                  <th className="px-4 py-3 text-left">Nộp lại</th>
                  <th className="px-4 py-3 text-left">Ngày cập nhật</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((app) => (
                  <tr key={app.profile_id} data-testid={`application-row-${app.user_id}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{app.full_name || "—"}</p>
                      <p className="text-xs text-gray-500">{app.email}</p>
                    </td>
                    <td className="px-4 py-3">{app.specialization || "—"}</td>
                    <td className="px-4 py-3">
                      {app.experience_years != null ? `${app.experience_years} năm` : "—"}
                    </td>
                    <td className="px-4 py-3">{app.resubmission_count}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(app.updated_at)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[app.approval_status]}>
                        {TEACHER_APPROVAL_STATUS_LABEL[app.approval_status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setDetail(app)}
                          className={`${ACTION_BTN} bg-gray-100 hover:bg-gray-200 dark:bg-gray-800`}
                        >
                          Xem chi tiết
                        </button>
                        {/* Chỉ hồ sơ pending mới duyệt/từ chối được (backend 400 APPLICATION_NOT_PENDING). */}
                        {app.approval_status === "pending" && (
                          <Can permission={PERMISSIONS.MANAGE_ROLES}>
                            <button
                              onClick={() => setApproveTarget(app)}
                              data-testid="application-approve"
                              className={`${ACTION_BTN} bg-green-600 text-white hover:bg-green-700`}
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => setRejectTarget(app)}
                              data-testid="application-reject"
                              className={`${ACTION_BTN} bg-red-600 text-white hover:bg-red-700`}
                            >
                              Từ chối
                            </button>
                          </Can>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-1 text-sm text-gray-500">
            <span>
              Trang {data.page}/{data.total_pages} — {data.total_count} hồ sơ
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700"
              >
                Trước
              </button>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </QueryState>

      <TeacherApplicationDetailDialog application={detail} onClose={() => setDetail(null)} />

      <ApproveConfirmDialog
        open={!!approveTarget}
        title="Duyệt hồ sơ giảng viên"
        description={
          <>
            Cấp vai trò giảng viên cho <strong>{approveTarget?.full_name || approveTarget?.email}</strong>?
            Người dùng sẽ được chuyển sang khu giáo viên ở lần thao tác kế tiếp.
          </>
        }
        isPending={approveMutation.isPending}
        onConfirm={onConfirmApprove}
        onClose={() => setApproveTarget(null)}
      />

      <RejectReasonDialog
        open={!!rejectTarget}
        title="Từ chối hồ sơ giảng viên"
        description={
          <>
            Hồ sơ của <strong>{rejectTarget?.full_name || rejectTarget?.email}</strong> sẽ bị từ
            chối. Ứng viên thấy lý do và có thể sửa hồ sơ để nộp lại (tối đa 3 lần).
          </>
        }
        isPending={rejectMutation.isPending}
        onSubmit={onSubmitReject}
        onClose={() => setRejectTarget(null)}
      />
    </div>
  );
}
