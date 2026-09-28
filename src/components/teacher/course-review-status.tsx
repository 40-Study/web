"use client";

/**
 * Trạng thái duyệt của khoá học ở trang quản lý khoá (giáo viên) — Phase 3.
 *
 * Giáo viên KHÔNG còn tự xuất bản: PUT /courses/:id với status "published" giờ bị backend chặn
 * (400 COURSE_STATUS_CHANGE_NOT_ALLOWED). Khoá nháp/bị từ chối phải "Gửi duyệt"
 * (POST /courses/:id/submit-review) và chỉ được xuất bản khi admin duyệt.
 *
 * QA vòng 2: khoá 0 bài không gửi duyệt được (D2, backend 422 COURSE_EMPTY); khoá đang chờ duyệt
 * bị khoá sửa, giáo viên "Rút yêu cầu duyệt" để về nháp (Q5, POST /courses/:id/withdraw-review).
 */

import { AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubmitCourseReview, useWithdrawCourseReview } from "@/hooks/queries/use-course-approval";
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
  /**
   * Số bài học hiện có (course.total_lessons). 0 -> khoá nút gửi duyệt kèm hướng dẫn; không
   * truyền (chưa biết) -> để backend quyết định (422 COURSE_EMPTY được dịch sang tiếng Việt).
   */
  lessonCount?: number;
}

const EMPTY_COURSE_HINT = "Thêm ít nhất 1 bài học trước khi gửi duyệt.";

/** Banner theo trạng thái + nút gửi duyệt/rút yêu cầu. Khoá đã xuất bản/lưu trữ không hiển thị gì. */
export function CourseReviewPanel({ courseId, status, rejectionReason, lessonCount }: CourseReviewPanelProps) {
  const submitReview = useSubmitCourseReview();
  const withdrawReview = useWithdrawCourseReview();
  const submit = () => submitReview.mutate(courseId);
  const isEmpty = lessonCount === 0;

  if (status === "draft") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={submit}
          isLoading={submitReview.isPending}
          disabled={isEmpty || submitReview.isPending}
          data-testid="submit-review"
        >
          Gửi duyệt
        </Button>
        {isEmpty && (
          <span className="text-xs text-muted-foreground" data-testid="submit-review-empty-hint">
            {EMPTY_COURSE_HINT}
          </span>
        )}
      </div>
    );
  }

  if (status === "pending_review") {
    return (
      <div
        role="status"
        data-testid="course-pending-banner"
        className="flex w-full flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center"
      >
        <div className="flex flex-1 items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Đang chờ quản trị viên duyệt. Khoá học sẽ tự xuất bản khi được chấp thuận. Trong lúc chờ,
            nội dung khoá bị khoá chỉnh sửa.
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-amber-300 bg-white"
          onClick={() => withdrawReview.mutate(courseId)}
          isLoading={withdrawReview.isPending}
          disabled={withdrawReview.isPending}
          data-testid="withdraw-review"
        >
          Rút yêu cầu duyệt
        </Button>
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={submit}
            isLoading={submitReview.isPending}
            disabled={isEmpty || submitReview.isPending}
            data-testid="resubmit-review"
          >
            Gửi duyệt lại
          </Button>
          {isEmpty && <span className="text-xs text-red-700">{EMPTY_COURSE_HINT}</span>}
        </div>
      </div>
    );
  }

  return null;
}
