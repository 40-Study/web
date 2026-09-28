"use client";

/**
 * Trạng thái duyệt của khoá học ở trang quản lý khoá (giáo viên) — Phase 3.
 *
 * Giáo viên KHÔNG còn tự xuất bản: PUT /courses/:id với status "published" giờ bị backend chặn
 * (400 COURSE_STATUS_CHANGE_NOT_ALLOWED). Khoá nháp/bị từ chối phải "Gửi duyệt"
 * (POST /courses/:id/submit-review) và chỉ được xuất bản khi admin duyệt.
 */

import { AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubmitCourseReview } from "@/hooks/queries/use-course-approval";
import { COURSE_STATUS_LABEL, isCourseStatus, type CourseStatus } from "@/types/approval";

const BADGE_CLASS: Record<CourseStatus, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  pending_review: "bg-amber-100 text-amber-700 border-amber-200",
  published: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  archived: "bg-slate-100 text-slate-600 border-slate-200",
};

export function CourseStatusBadge({ status }: { status?: string }) {
  // Trạng thái lạ (backend thêm giá trị mới) hiển thị nguyên văn thay vì ép thành "Bản nháp".
  if (!isCourseStatus(status)) {
    return <Badge variant="outline">{status || "Không rõ"}</Badge>;
  }
  return (
    <Badge variant="outline" className={BADGE_CLASS[status]} data-testid="course-status-badge">
      {COURSE_STATUS_LABEL[status]}
    </Badge>
  );
}

interface CourseReviewPanelProps {
  courseId: string;
  status?: string;
  rejectionReason?: string | null;
}

/** Banner theo trạng thái + nút gửi duyệt. Khoá đã xuất bản/lưu trữ không hiển thị gì. */
export function CourseReviewPanel({ courseId, status, rejectionReason }: CourseReviewPanelProps) {
  const submitReview = useSubmitCourseReview();
  const submit = () => submitReview.mutate(courseId);

  if (status === "draft") {
    return (
      <Button size="sm" onClick={submit} isLoading={submitReview.isPending} data-testid="submit-review">
        Gửi duyệt
      </Button>
    );
  }

  if (status === "pending_review") {
    return (
      <div
        role="status"
        data-testid="course-pending-banner"
        className="flex w-full items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        <Clock className="h-4 w-4 shrink-0" />
        Đang chờ quản trị viên duyệt. Khoá học sẽ tự xuất bản khi được chấp thuận.
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div
        role="alert"
        data-testid="course-rejected-banner"
        className="w-full space-y-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Khoá học bị từ chối</p>
            <p className="mt-1 whitespace-pre-line" data-testid="course-rejection-reason">
              {rejectionReason || "Quản trị viên không ghi lý do."}
            </p>
            <p className="mt-1 text-xs text-red-700">Chỉnh sửa theo góp ý rồi gửi duyệt lại.</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="destructive"
          onClick={submit}
          isLoading={submitReview.isPending}
          data-testid="resubmit-review"
        >
          Gửi duyệt lại
        </Button>
      </div>
    );
  }

  return null;
}
