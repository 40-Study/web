/**
 * React Query hooks for course management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  courseService,
  type ApiCourse,
  type CourseListParams,
  type CreateCourseDTO,
  type UpdateCourseDTO,
} from "@/services/course.service";

export const courseKeys = {
  all: ["courses"] as const,
  list: (params?: CourseListParams) => [...courseKeys.all, "list", params] as const,
  detail: (id: string) => [...courseKeys.all, "detail", id] as const,
  slug: (slug: string) => [...courseKeys.all, "slug", slug] as const,
  my: (status?: string) => [...courseKeys.all, "my", status] as const,
  enrolled: () => [...courseKeys.all, "enrolled"] as const,
  featured: () => [...courseKeys.all, "featured"] as const,
};

/** List all courses with optional filters */
export function useCourses(params?: CourseListParams) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: () => courseService.getCourses(params),
  });
}

/** Get course by ID */
export function useCourse(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => courseService.getCourseById(id),
    enabled: !!id,
  });
}

/** Get course by slug */
export function useCourseBySlug(slug: string) {
  return useQuery({
    queryKey: courseKeys.slug(slug),
    queryFn: () => courseService.getCourseBySlug(slug),
    enabled: !!slug,
  });
}

/** Get teacher's own courses */
export function useMyCourses(status?: string) {
  return useQuery({
    queryKey: courseKeys.my(status),
    queryFn: () => courseService.getMyCourses({ status }),
  });
}

/** Get enrolled courses */
export function useEnrolledCourses() {
  return useQuery({
    queryKey: courseKeys.enrolled(),
    queryFn: () => courseService.getEnrolledCourses(),
  });
}

/** Get featured courses */
export function useFeaturedCourses() {
  return useQuery({
    queryKey: courseKeys.featured(),
    queryFn: () => courseService.getFeaturedCourses(),
  });
}

/** Create course mutation */
export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCourseDTO) => courseService.createCourse(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("Tạo khóa học thành công");
    },
    onError: () => toast.error("Không thể tạo khóa học"),
  });
}

/** Update course mutation */
export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCourseDTO }) =>
      courseService.updateCourse(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: courseKeys.all });
      qc.invalidateQueries({ queryKey: courseKeys.detail(id) });
      toast.success("Cập nhật khóa học thành công");
    },
    onError: () => toast.error("Không thể cập nhật khóa học"),
  });
}

/** Delete course mutation */
export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseService.deleteCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("Xóa khóa học thành công");
    },
    onError: () => toast.error("Không thể xóa khóa học"),
  });
}

/** Enroll in course mutation */
export function useEnrollCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => courseService.enroll(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.enrolled() });
      toast.success("Đăng ký khóa học thành công");
    },
    onError: () => toast.error("Không thể đăng ký khóa học"),
  });
}
