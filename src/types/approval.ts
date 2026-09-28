/**
 * Types Phase 3 — duyệt khoá học + duyệt giáo viên.
 *
 * SSOT enum là backend `internal/model/course_status.go`; mọi giá trị ở đây PHẢI trùng nguyên
 * văn snake_case của contract phase3 (không tự đặt tên khác phía web).
 */

import type { ApiCourse } from "@/services/course.service";

// ─── Khoá học ───────────────────────────────────────────────────────────────

export const COURSE_STATUSES = [
  "draft",
  "pending_review",
  "published",
  "rejected",
  "archived",
] as const;

export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  draft: "Bản nháp",
  pending_review: "Chờ duyệt",
  published: "Đã xuất bản",
  rejected: "Bị từ chối",
  archived: "Lưu trữ",
};

export function isCourseStatus(value: unknown): value is CourseStatus {
  return typeof value === "string" && (COURSE_STATUSES as readonly string[]).includes(value);
}

/** Phần tử của GET /admin/courses = CourseResponseDTO + thông tin giảng viên. */
export interface AdminCourseItem extends ApiCourse {
  instructor_name: string;
  instructor_email: string;
}

export interface AdminCourseListResponse {
  courses: AdminCourseItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminCourseListParams {
  status?: CourseStatus;
  keyword?: string;
  page?: number;
  page_size?: number;
}

/** 200 của POST /courses/:id/submit-review. */
export interface SubmitCourseReviewResult {
  id: string;
  status: CourseStatus;
  submitted_at: string;
}

/** 200 của POST /admin/courses/:id/approve|reject. */
export interface CourseReviewDecisionResult {
  id: string;
  status: CourseStatus;
}

// ─── Giáo viên đăng ký ──────────────────────────────────────────────────────

export const TEACHER_APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;

export type TeacherApprovalStatus = (typeof TEACHER_APPROVAL_STATUSES)[number];

export const TEACHER_APPROVAL_STATUS_LABEL: Record<TeacherApprovalStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Bị từ chối",
};

/** Nộp LẠI tối đa 3 lần sau lần nộp đầu (contract phase3, MAX_TEACHER_RESUBMISSIONS). */
export const MAX_TEACHER_RESUBMISSIONS = 3;

export interface TeacherProfileFields {
  specialization?: string;
  education?: string;
  experience_years?: number;
  certificate_info?: string;
  department?: string;
}

export interface TeacherApplicationProfile extends TeacherProfileFields {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  approval_status: TeacherApprovalStatus;
  rejection_reason?: string;
  reviewed_at?: string;
  resubmission_count: number;
}

/** GET /teacher-profiles/me — hồ sơ + 2 field tính sẵn phía backend. */
export interface MyTeacherApplication extends TeacherApplicationProfile {
  max_resubmissions: number;
  can_resubmit: boolean;
}

/** Body POST /teacher-profiles và PUT /teacher-profiles/:id (KHÔNG gửi user_id). */
export type TeacherProfileInput = TeacherProfileFields;

export interface TeacherApplicationItem extends TeacherProfileFields {
  user_id: string;
  profile_id: string;
  email: string;
  full_name: string;
  approval_status: TeacherApprovalStatus;
  rejection_reason?: string;
  resubmission_count: number;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
}

export interface TeacherApplicationListResponse {
  items: TeacherApplicationItem[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface TeacherApplicationListParams {
  status?: TeacherApprovalStatus;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface TeacherApplicationDecisionResult {
  user_id: string;
  approval_status: TeacherApprovalStatus;
}
