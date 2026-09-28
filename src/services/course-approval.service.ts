/**
 * Course approval service — giáo viên gửi duyệt + admin duyệt/từ chối khoá học (Phase 3).
 *
 * Từ Phase 3, PUT /courses/:id KHÔNG còn nhận status "published"/"pending_review"/"rejected"
 * (400 COURSE_STATUS_CHANGE_NOT_ALLOWED) — mọi chuyển trạng thái duyệt đi qua file này.
 */

import { api } from "@/lib/api-client";
import type {
  AdminCourseListParams,
  AdminCourseListResponse,
  CourseReviewDecisionResult,
  SubmitCourseReviewResult,
} from "@/types/approval";

type Envelope<T> = { message: string; data: T };

export const courseApprovalService = {
  /** POST /courses/:id/submit-review — giáo viên chủ khoá gửi duyệt (draft|rejected → pending_review). */
  submitReview: (courseId: string) =>
    api
      .post<Envelope<SubmitCourseReviewResult>>(`/courses/${courseId}/submit-review`)
      .then((r) => r.data.data),

  /**
   * POST /courses/:id/withdraw-review — giáo viên chủ khoá rút yêu cầu duyệt (pending_review →
   * draft). Khoá đang chờ duyệt bị khoá sửa (409 COURSE_PENDING_REVIEW); đây là đường duy nhất
   * để sửa tiếp (QA vòng 2, Q5).
   */
  withdrawReview: (courseId: string) =>
    api
      .post<Envelope<CourseReviewDecisionResult>>(`/courses/${courseId}/withdraw-review`)
      .then((r) => r.data.data),

  /** GET /admin/courses — danh sách khoá theo trạng thái (mặc định pending_review phía backend). */
  adminList: (params?: AdminCourseListParams) =>
    api
      .get<Envelope<AdminCourseListResponse>>("/admin/courses", { params })
      .then((r) => r.data.data),

  /** POST /admin/courses/:id/approve — pending_review → published. */
  approve: (courseId: string) =>
    api
      .post<Envelope<CourseReviewDecisionResult>>(`/admin/courses/${courseId}/approve`)
      .then((r) => r.data.data),

  /** POST /admin/courses/:id/reject — pending_review → rejected, bắt buộc lý do. */
  reject: (courseId: string, reason: string) =>
    api
      .post<Envelope<CourseReviewDecisionResult>>(`/admin/courses/${courseId}/reject`, { reason })
      .then((r) => r.data.data),
};
