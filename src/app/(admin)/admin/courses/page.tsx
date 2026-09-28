"use client";

import { useState } from "react";
import {
  useAdminCourses,
  useApproveCourse,
  useRejectCourse,
} from "@/hooks/queries/use-course-approval";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { QueryState } from "@/components/common/query-state";
import { Badge } from "@/components/ui/badge";
import { ApproveConfirmDialog, RejectReasonDialog } from "@/components/admin/review-dialogs";
import { CourseReviewDetailDialog } from "@/components/admin/course-review-detail-dialog";
import { formatDate } from "@/lib/utils";
import {
  COURSE_STATUSES,
  COURSE_STATUS_LABEL,
  isCourseStatus,
  type AdminCourseItem,
  type CourseStatus,
} from "@/types/approval";

const PAGE_SIZE = 20;

const STATUS_VARIANT: Record<CourseStatus, "success" | "warning" | "destructive" | "outline" | "secondary"> = {
  draft: "outline",
  pending_review: "warning",
  published: "success",
  rejected: "destructive",
  archived: "secondary",
};

const ACTION_BTN = "rounded px-2 py-1 text-xs font-medium disabled:opacity-50";

export default function AdminCoursesPage() {
  // Mặc định "Chờ duyệt": việc chính của trang là xử lý hàng đợi duyệt.
  const [status, setStatus] = useState<CourseStatus>("pending_review");
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300);
  const [page, setPage] = useState(1);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<AdminCourseItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminCourseItem | null>(null);

  const { data, isLoading, isError, error, refetch } = useAdminCourses({
    status,
    keyword: debouncedKeyword || undefined,
    page,
    page_size: PAGE_SIZE,
  });
  const approveMutation = useApproveCourse();
  const rejectMutation = useRejectCourse();

  const courses = data?.courses ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / (data.page_size || PAGE_SIZE))) : 1;

  const onConfirmApprove = () => {
    if (!approveTarget) return;
    approveMutation.mutate(approveTarget.id, { onSuccess: () => setApproveTarget(null) });
  };

  const onSubmitReject = (reason: string) => {
    if (!rejectTarget) return;
    rejectMutation.mutate({ id: rejectTarget.id, reason }, { onSuccess: () => setRejectTarget(null) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Duyệt khoá học</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Khoá học giáo viên gửi duyệt chỉ được xuất bản sau khi quản trị viên chấp thuận.
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
            placeholder="Tìm theo tên khoá học..."
            aria-label="Tìm khoá học"
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <select
            value={status}
            aria-label="Lọc theo trạng thái"
            data-testid="course-status-filter"
            onChange={(e) => {
              if (isCourseStatus(e.target.value)) setStatus(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {COURSE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {COURSE_STATUS_LABEL[s]}
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
        isEmpty={!isLoading && !isError && courses.length === 0}
        emptyTitle="Không có khoá học nào"
        emptyDescription={
          status === "pending_review"
            ? "Hiện không có khoá học nào chờ duyệt."
            : "Không có khoá học khớp bộ lọc hiện tại."
        }
      >
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left">Khoá học</th>
                  <th className="px-4 py-3 text-left">Giáo viên</th>
                  <th className="px-4 py-3 text-left">Ngày nộp</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {courses.map((course) => (
                  <tr key={course.id} data-testid={`course-row-${course.id}`}>
                    <td className="px-4 py-3 font-medium">{course.title}</td>
                    <td className="px-4 py-3">
                      <p>{course.instructor_name || "—"}</p>
                      <p className="text-xs text-gray-500">{course.instructor_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {course.submitted_at ? formatDate(course.submitted_at) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {isCourseStatus(course.status) ? (
                        <Badge variant={STATUS_VARIANT[course.status]}>
                          {COURSE_STATUS_LABEL[course.status]}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{course.status ?? "—"}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setDetailId(course.id)}
                          className={`${ACTION_BTN} bg-gray-100 hover:bg-gray-200 dark:bg-gray-800`}
                        >
                          Xem chi tiết
                        </button>
                        {/* Duyệt/từ chối chỉ hợp lệ khi đang chờ duyệt (backend 400 INVALID_COURSE_STATUS). */}
                        {course.status === "pending_review" && (
                          <Can permission={PERMISSIONS.COURSES_APPROVE_ALL}>
                            <button
                              onClick={() => setApproveTarget(course)}
                              data-testid="course-approve"
                              className={`${ACTION_BTN} bg-green-600 text-white hover:bg-green-700`}
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => setRejectTarget(course)}
                              data-testid="course-reject"
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

        {data && totalPages > 1 && (
          <div className="flex items-center justify-between px-1 text-sm text-gray-500">
            <span>
              Trang {page}/{totalPages} — {data.total} khoá học
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
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </QueryState>

      <CourseReviewDetailDialog courseId={detailId} onClose={() => setDetailId(null)} />

      <ApproveConfirmDialog
        open={!!approveTarget}
        title="Duyệt khoá học"
        description={
          <>
            Xuất bản khoá <strong>{approveTarget?.title}</strong> của{" "}
            {approveTarget?.instructor_name || approveTarget?.instructor_email}? Khoá học sẽ hiển
            thị công khai cho học viên ngay sau khi duyệt.
          </>
        }
        isPending={approveMutation.isPending}
        onConfirm={onConfirmApprove}
        onClose={() => setApproveTarget(null)}
      />

      <RejectReasonDialog
        open={!!rejectTarget}
        title="Từ chối khoá học"
        description={
          <>
            Khoá <strong>{rejectTarget?.title}</strong> sẽ trả về cho giáo viên kèm lý do để chỉnh
            sửa và gửi duyệt lại.
          </>
        }
        isPending={rejectMutation.isPending}
        onSubmit={onSubmitReject}
        onClose={() => setRejectTarget(null)}
      />
    </div>
  );
}
