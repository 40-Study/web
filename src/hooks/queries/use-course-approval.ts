/**
 * React Query hooks — gửi duyệt khoá (giáo viên) + duyệt/từ chối khoá (admin), Phase 3.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { courseApprovalService } from "@/services/course-approval.service";
import { courseKeys } from "@/hooks/queries/use-courses";
import { approvalErrorMessage } from "@/lib/approval-errors";
import type { AdminCourseListParams } from "@/types/approval";

export const adminCourseKeys = {
  all: ["admin-courses"] as const,
  list: (params?: AdminCourseListParams) => [...adminCourseKeys.all, "list", params ?? {}] as const,
};

/** POST /courses/:id/submit-review — giáo viên gửi khoá (nháp/bị từ chối) cho admin duyệt. */
export function useSubmitCourseReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => courseApprovalService.submitReview(courseId),
    onSuccess: (_, courseId) => {
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      qc.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("Đã gửi khoá học cho quản trị viên duyệt");
    },
    onError: (error) => {
      toast.error(approvalErrorMessage(error, "Không thể gửi duyệt khoá học, thử lại sau."));
    },
  });
}

/** POST /courses/:id/withdraw-review — giáo viên rút yêu cầu duyệt để sửa tiếp (QA vòng 2, Q5). */
export function useWithdrawCourseReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => courseApprovalService.withdrawReview(courseId),
    onSuccess: (_, courseId) => {
      qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      qc.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("Đã rút yêu cầu duyệt. Khoá học trở về bản nháp, bạn có thể chỉnh sửa.");
    },
    onError: (error) => {
      toast.error(approvalErrorMessage(error, "Không thể rút yêu cầu duyệt, thử lại sau."));
    },
  });
}

/** GET /admin/courses — danh sách khoá cần duyệt (admin). */
export function useAdminCourses(params?: AdminCourseListParams) {
  return useQuery({
    queryKey: adminCourseKeys.list(params),
    queryFn: () => courseApprovalService.adminList(params),
  });
}

function useInvalidateAfterReview() {
  const qc = useQueryClient();
  return (courseId: string) => {
    qc.invalidateQueries({ queryKey: adminCourseKeys.all });
    // Khoá vừa đổi trạng thái có thể đang được cache ở trang chi tiết/danh sách công khai.
    qc.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    qc.invalidateQueries({ queryKey: courseKeys.all });
  };
}

/** POST /admin/courses/:id/approve. */
export function useApproveCourse() {
  const invalidate = useInvalidateAfterReview();
  return useMutation({
    mutationFn: (courseId: string) => courseApprovalService.approve(courseId),
    onSuccess: (_, courseId) => {
      invalidate(courseId);
      toast.success("Đã duyệt và xuất bản khoá học");
    },
    onError: (error) => {
      toast.error(approvalErrorMessage(error, "Không thể duyệt khoá học, thử lại sau."));
    },
  });
}

/** POST /admin/courses/:id/reject — body {reason}. */
export function useRejectCourse() {
  const invalidate = useInvalidateAfterReview();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      courseApprovalService.reject(id, reason),
    onSuccess: (_, { id }) => {
      invalidate(id);
      toast.success("Đã từ chối khoá học");
    },
    onError: (error) => {
      toast.error(approvalErrorMessage(error, "Không thể từ chối khoá học, thử lại sau."));
    },
  });
}
