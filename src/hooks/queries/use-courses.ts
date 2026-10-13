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
import { approvalErrorMessage } from "@/lib/approval-errors";
import { ApiError } from "@/lib/errors";
import type { AdminCourseListParams } from "@/types/approval";

export const courseKeys = {
  all: ["courses"] as const,
  list: (params?: CourseListParams) => [...courseKeys.all, "list", params] as const,
  detail: (id: string) => [...courseKeys.all, "detail", id] as const,
  slug: (slug: string) => [...courseKeys.all, "slug", slug] as const,
  my: (status?: string) => [...courseKeys.all, "my", status] as const,
  enrolled: () => [...courseKeys.all, "enrolled"] as const,
  featured: () => [...courseKeys.all, "featured"] as const,
};

/**
 * Danh sách khoá của admin (`/admin/courses`) có khoá query riêng, không nằm dưới `courseKeys.all`.
 * Đặt ở đây (không ở use-course-approval) để xoá/lưu trữ khoá làm mới được cả danh sách admin mà
 * không tạo vòng import; use-course-approval re-export lại tên cũ.
 */
export const adminCourseKeys = {
  all: ["admin-courses"] as const,
  list: (params?: AdminCourseListParams) => [...adminCourseKeys.all, "list", params ?? {}] as const,
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
    staleTime: 30 * 1000, // 30s - avoid refetch on every mount
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
    // 400 DISCOUNT_PRICE_INVALID -> lý do tiếng Việt cụ thể thay vì lỗi chung.
    onError: (error) => toast.error(approvalErrorMessage(error, "Không thể tạo khóa học")),
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
    onError: (error) => toast.error(approvalErrorMessage(error, "Không thể cập nhật khóa học")),
  });
}

/** Mã 409 khi xoá khoá còn học viên ghi danh hoạt động (backend: handler/course_edit_lock.go). */
const COURSE_HAS_ENROLLMENTS_CODE = "COURSE_HAS_ENROLLMENTS";

/** Delete course mutation */
export function useDeleteCourse() {
  const qc = useQueryClient();

  /**
   * "Lưu trữ" = PUT /courses/:id {status:"archived"} (published -> archived: ngừng bán, học viên cũ không bị
   * ảnh hưởng). Backend không có endpoint riêng; khoá chưa xuất bản sẽ bị 400 COURSE_STATUS_CHANGE_NOT_ALLOWED
   * và lý do được báo lại cho giảng viên.
   */
  const archive = (id: string) => {
    courseService
      .updateCourse(id, { status: "archived" })
      .then(() => {
        qc.invalidateQueries({ queryKey: courseKeys.all });
        qc.invalidateQueries({ queryKey: adminCourseKeys.all });
        toast.success("Đã lưu trữ khoá học");
      })
      .catch((error: unknown) => toast.error(approvalErrorMessage(error, "Không thể lưu trữ khoá học")));
  };

  return useMutation({
    mutationFn: (id: string) => courseService.deleteCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseKeys.all });
      qc.invalidateQueries({ queryKey: adminCourseKeys.all });
      toast.success("Xóa khóa học thành công");
    },
    // 409 COURSE_PENDING_REVIEW (khoá đang chờ duyệt) -> câu tiếng Việt rõ nghĩa thay vì lỗi chung.
    // 409 COURSE_HAS_ENROLLMENTS -> kèm nút "Lưu trữ" thay vì chỉ khuyên bằng chữ.
    onError: (error, id) => {
      const message = approvalErrorMessage(error, "Không thể xóa khóa học");
      if (error instanceof ApiError && error.code === COURSE_HAS_ENROLLMENTS_CODE) {
        toast.error(message, { action: { label: "Lưu trữ", onClick: () => archive(id) } });
        return;
      }
      toast.error(message);
    },
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
