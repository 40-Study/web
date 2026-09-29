/**
 * Teacher & teacher profile service
 * Endpoints: /teachers, /teacher-profiles
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Teacher {
  id: string;
  user_id: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface TeacherStudent {
  id: string;
  name: string;
  avatar?: string;
  student_id?: string;
  parent_name?: string;
  parent_phone?: string;
  /**
   * Review đối kháng backend PR #70 (MAJOR): backend `TeacherStudentDTO.ClassID`/`ClassName`
   * đổi thành `*uuid.UUID`/`*string` với `omitempty` (`internal/dto/teacherDTO.go`) — học viên
   * ghi danh thẳng vào khóa (không qua lớp) không còn bị bịa ra một lớp giả. Field này vắng
   * mặt hẳn khỏi JSON khi không có lớp, nên KHÔNG được khai bắt buộc ở đây — khai bắt buộc sẽ
   * đọc ra `undefined` mà TypeScript không cảnh báo, và mọi học viên "chưa có lớp" sẽ có
   * `class_id === undefined` giống hệt nhau (xem `teacher/students/[id]/page.tsx`).
   */
  class_id?: string;
  class_name?: string;
  course_id?: string;
  course_name?: string;
  status: string;
  progress?: number;
  last_active?: string;
  enrolled_at: string;
}

export interface TeacherProfile {
  id: string;
  user_id: string;
  specialization?: string;
  education?: string;
  experience_years?: number;
  certificate_info?: string;
  department?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTeacherProfileDTO {
  user_id: string;
  specialization?: string;
  education?: string;
  experience_years?: number;
  certificate_info?: string;
  department?: string;
}

export interface UpdateTeacherProfileDTO {
  specialization?: string;
  education?: string;
  experience_years?: number;
  certificate_info?: string;
  department?: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const teacherService = {
  // ── Teachers ──────────────────────────────────────────────────────────────

  /** GET /teachers */
  list: () =>
    api.get<R<Teacher[]>>("/teachers").then((r) => r.data.data),

  /** GET /teachers/:teacherId */
  getById: (teacherId: string) =>
    api.get<R<Teacher>>(`/teachers/${teacherId}`).then((r) => r.data.data),

  /** DELETE /teachers/:teacherId */
  delete: (teacherId: string) =>
    api.delete<R<null>>(`/teachers/${teacherId}`).then((r) => r.data),

  // ── Teacher Profiles ──────────────────────────────────────────────────────

  /** POST /teacher-profiles */
  createProfile: (data: CreateTeacherProfileDTO) =>
    api.post<R<TeacherProfile>>("/teacher-profiles", data).then((r) => r.data.data),

  /** GET /teacher-profiles */
  listProfiles: () =>
    api.get<R<TeacherProfile[]>>("/teacher-profiles").then((r) => r.data.data),

  /** GET /teacher-profiles/:profileId */
  getProfile: (profileId: string) =>
    api.get<R<TeacherProfile>>(`/teacher-profiles/${profileId}`).then((r) => r.data.data),

  /** PUT /teacher-profiles/:profileId */
  updateProfile: (profileId: string, data: UpdateTeacherProfileDTO) =>
    api.put<R<TeacherProfile>>(`/teacher-profiles/${profileId}`, data).then((r) => r.data.data),

  /** DELETE /teacher-profiles/:profileId */
  deleteProfile: (profileId: string) =>
    api.delete<R<null>>(`/teacher-profiles/${profileId}`).then((r) => r.data),

  // ── Teacher convenience endpoints ────────────────────────────────────────

  /** GET /teachers/me/students — all students across teacher's classes */
  getMyStudents: (pageSize = 200) =>
    api
      .get<R<{ students: TeacherStudent[]; total: number; page: number; page_size: number }>>(
        "/teachers/me/students",
        { params: { page: 1, page_size: pageSize } }
      )
      .then((r) => r.data.data.students),
};
