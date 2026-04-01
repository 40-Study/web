/**
 * React Query hooks for course enrollment and progress tracking
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { enrollmentService } from "@/services/enrollment.service";
import type { UpdateProgressDTO } from "@/services/enrollment.service";

export const enrollmentKeys = {
  all: ["enrollments"] as const,
  my: () => [...enrollmentKeys.all, "my"] as const,
  byCourse: (courseId: string) => [...enrollmentKeys.all, "course", courseId] as const,
  detail: (id: string) => [...enrollmentKeys.all, "detail", id] as const,
  progress: (id: string) => [...enrollmentKeys.all, "progress", id] as const,
};

/** Current user's enrollments */
export function useMyEnrollments() {
  return useQuery({
    queryKey: enrollmentKeys.my(),
    queryFn: () => enrollmentService.getMyEnrollments(),
  });
}

/** All enrollments for a course (teacher/admin) */
export function useCourseEnrollments(courseId: string) {
  return useQuery({
    queryKey: enrollmentKeys.byCourse(courseId),
    queryFn: () => enrollmentService.getCourseEnrollments(courseId),
    enabled: !!courseId,
  });
}

/** Lesson progress for an enrollment */
export function useEnrollmentProgress(enrollmentId: string) {
  return useQuery({
    queryKey: enrollmentKeys.progress(enrollmentId),
    queryFn: () => enrollmentService.getProgress(enrollmentId),
    enabled: !!enrollmentId,
  });
}

/** Enroll current user in a course */
export function useEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => enrollmentService.enroll(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.my() });
      toast.success("Đăng ký khóa học thành công");
    },
    onError: () => toast.error("Không thể đăng ký khóa học"),
  });
}

/** Unenroll from a course */
export function useUnenroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) => enrollmentService.unenroll(enrollmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.my() });
      toast.success("Hủy đăng ký thành công");
    },
    onError: () => toast.error("Không thể hủy đăng ký"),
  });
}

/** Update lesson progress within an enrollment */
export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      enrollmentId,
      lessonId,
      data,
    }: {
      enrollmentId: string;
      lessonId: string;
      data: UpdateProgressDTO;
    }) => enrollmentService.updateProgress(enrollmentId, lessonId, data),
    onSuccess: (_, { enrollmentId }) => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.progress(enrollmentId) });
    },
    onError: () => toast.error("Không thể cập nhật tiến độ"),
  });
}
