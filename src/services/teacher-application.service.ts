/**
 * Teacher application service — ứng viên nộp hồ sơ giảng viên + admin duyệt (Phase 3).
 *
 * Không dùng teacherService.createProfile cũ: DTO cũ bắt buộc `user_id` trong body, còn contract
 * phase3 lấy user từ access token (body chỉ gồm các field hồ sơ).
 */

import { api } from "@/lib/api-client";
import { NotFoundError } from "@/lib/errors";
import type {
  MyTeacherApplication,
  TeacherApplicationDecisionResult,
  TeacherApplicationListParams,
  TeacherApplicationListResponse,
  TeacherApplicationProfile,
  TeacherProfileInput,
} from "@/types/approval";

type Envelope<T> = { message: string; data: T };

export const teacherApplicationService = {
  /**
   * GET /teacher-profiles/me. 404 là trạng thái HỢP LỆ "chưa nộp hồ sơ" (web hiện form tạo),
   * không phải lỗi — trả null để react-query không coi là error và không retry.
   */
  getMine: async (): Promise<MyTeacherApplication | null> => {
    try {
      const r = await api.get<Envelope<MyTeacherApplication>>("/teacher-profiles/me");
      return r.data.data;
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  },

  /** POST /teacher-profiles — tạo hồ sơ (approval_status mặc định pending). */
  create: (data: TeacherProfileInput) =>
    api
      .post<Envelope<TeacherApplicationProfile>>("/teacher-profiles", data)
      .then((r) => r.data.data),

  /** PUT /teacher-profiles/:id — sửa hồ sơ (id = profile id, chỉ chủ hồ sơ). */
  update: (profileId: string, data: TeacherProfileInput) =>
    api
      .put<Envelope<TeacherApplicationProfile>>(`/teacher-profiles/${profileId}`, data)
      .then((r) => r.data.data),

  /** POST /teacher-profiles/me/resubmit — rejected → pending, resubmission_count +1. */
  resubmit: () =>
    api
      .post<Envelope<MyTeacherApplication>>("/teacher-profiles/me/resubmit")
      .then((r) => r.data.data),

  /** GET /admin/teacher-applications — danh sách hồ sơ (mặc định pending phía backend). */
  adminList: (params?: TeacherApplicationListParams) =>
    api
      .get<Envelope<TeacherApplicationListResponse>>("/admin/teacher-applications", { params })
      .then((r) => r.data.data),

  /** POST /admin/teacher-applications/:userId/approve — gán TEACHER, gỡ TEACHER_APPLICANT. */
  approve: (userId: string) =>
    api
      .post<Envelope<TeacherApplicationDecisionResult>>(
        `/admin/teacher-applications/${userId}/approve`
      )
      .then((r) => r.data.data),

  /** POST /admin/teacher-applications/:userId/reject — bắt buộc lý do. */
  reject: (userId: string, reason: string) =>
    api
      .post<Envelope<TeacherApplicationDecisionResult>>(
        `/admin/teacher-applications/${userId}/reject`,
        { reason }
      )
      .then((r) => r.data.data),
};
