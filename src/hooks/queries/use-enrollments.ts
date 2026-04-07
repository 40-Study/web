/**
 * React Query hooks for course enrollment and progress tracking
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { enrollmentService } from "@/services/enrollment.service";
import type { UpdateProgressDTO } from "@/services/enrollment.service";

export const enrollmentKeys = {
  all: ["enrollments"] as const,
  detail: (id: string) => [...enrollmentKeys.all, "detail", id] as const,
};

/** Current user's enrollments */
export function useMyEnrollments() {
  return useQuery({
    queryKey: enrollmentKeys.all,
    queryFn: () => enrollmentService.getAll(),
  });
}

/** Enroll current user in a course */
export function useEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => enrollmentService.enroll(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.all });
      toast.success("Đăng ký khóa học thành công");
    },
    onError: () => toast.error("Không thể đăng ký khóa học"),
  });
}

/** Unenroll from a course */
export function useUnenroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => enrollmentService.unenroll(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.all });
      toast.success("Hủy đăng ký thành công");
    },
    onError: () => toast.error("Không thể hủy đăng ký"),
  });
}

/** Update lesson progress */
export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: UpdateProgressDTO }) =>
      enrollmentService.updateProgress(lessonId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.all });
    },
    onError: () => toast.error("Không thể cập nhật tiến độ"),
  });
}
