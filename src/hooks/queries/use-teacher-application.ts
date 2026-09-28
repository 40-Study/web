/**
 * React Query hooks — hồ sơ ứng tuyển giảng viên (ứng viên + admin), Phase 3.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { teacherApplicationService } from "@/services/teacher-application.service";
import { approvalErrorMessage } from "@/lib/approval-errors";
import type { TeacherApplicationListParams, TeacherProfileInput } from "@/types/approval";

/** Chu kỳ poll khi hồ sơ đang chờ duyệt (contract mục C: 15–30s). */
export const PENDING_APPLICATION_POLL_MS = 15_000;

export const teacherApplicationKeys = {
  all: ["teacher-application"] as const,
  mine: () => [...teacherApplicationKeys.all, "me"] as const,
  adminList: (params?: TeacherApplicationListParams) =>
    [...teacherApplicationKeys.all, "admin", params ?? {}] as const,
};

/**
 * GET /teacher-profiles/me — null = chưa nộp hồ sơ (404).
 *
 * Khi đang pending phải poll: admin duyệt xong thì access token cũ của ứng viên bị vô hiệu
 * (401 ROLE_CHANGED); chính request poll kế tiếp kích hoạt interceptor refresh → role_changed →
 * chuyển thẳng sang khu giáo viên mà ứng viên không cần đăng xuất/đăng nhập lại.
 */
export function useMyTeacherApplication() {
  return useQuery({
    queryKey: teacherApplicationKeys.mine(),
    queryFn: () => teacherApplicationService.getMine(),
    refetchInterval: (query) =>
      query.state.data?.approval_status === "pending" ? PENDING_APPLICATION_POLL_MS : false,
  });
}

function useApplicantMutationDone() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: teacherApplicationKeys.mine() });
}

/** POST /teacher-profiles — nộp hồ sơ lần đầu. */
export function useCreateTeacherApplication() {
  const done = useApplicantMutationDone();
  return useMutation({
    mutationFn: (data: TeacherProfileInput) => teacherApplicationService.create(data),
    onSuccess: () => {
      done();
      toast.success("Đã nộp hồ sơ, vui lòng chờ quản trị viên duyệt");
    },
    onError: (error) => toast.error(approvalErrorMessage(error, "Không thể nộp hồ sơ, thử lại sau.")),
  });
}

/**
 * Sửa hồ sơ rồi nộp lại (PUT /teacher-profiles/:id → POST /teacher-profiles/me/resubmit).
 * Gộp 2 bước trong 1 mutation: nộp lại mà chưa lưu nội dung sửa thì admin sẽ duyệt bản cũ.
 */
export function useResubmitTeacherApplication() {
  const done = useApplicantMutationDone();
  return useMutation({
    mutationFn: async ({ profileId, data }: { profileId: string; data: TeacherProfileInput }) => {
      await teacherApplicationService.update(profileId, data);
      return teacherApplicationService.resubmit();
    },
    onSuccess: () => {
      done();
      toast.success("Đã nộp lại hồ sơ, vui lòng chờ quản trị viên duyệt");
    },
    onError: (error) => {
      // Lỗi ở bước resubmit sau khi PUT đã lưu — làm mới để form hiện đúng dữ liệu đã lưu.
      done();
      toast.error(approvalErrorMessage(error, "Không thể nộp lại hồ sơ, thử lại sau."));
    },
  });
}

/** GET /admin/teacher-applications (admin). */
export function useAdminTeacherApplications(params?: TeacherApplicationListParams) {
  return useQuery({
    queryKey: teacherApplicationKeys.adminList(params),
    queryFn: () => teacherApplicationService.adminList(params),
  });
}

function useAdminDecisionDone() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: teacherApplicationKeys.all });
}

/** POST /admin/teacher-applications/:userId/approve. */
export function useApproveTeacherApplication() {
  const done = useAdminDecisionDone();
  return useMutation({
    mutationFn: (userId: string) => teacherApplicationService.approve(userId),
    onSuccess: () => {
      done();
      toast.success("Đã duyệt hồ sơ — người dùng đã trở thành giảng viên");
    },
    onError: (error) => toast.error(approvalErrorMessage(error, "Không thể duyệt hồ sơ, thử lại sau.")),
  });
}

/** POST /admin/teacher-applications/:userId/reject — body {reason}. */
export function useRejectTeacherApplication() {
  const done = useAdminDecisionDone();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      teacherApplicationService.reject(userId, reason),
    onSuccess: () => {
      done();
      toast.success("Đã từ chối hồ sơ");
    },
    onError: (error) =>
      toast.error(approvalErrorMessage(error, "Không thể từ chối hồ sơ, thử lại sau.")),
  });
}
