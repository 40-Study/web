/**
 * Class service — classes nested under courses
 * Endpoints: /courses/:courseId/classes, teachers, students, attendances, contents
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Class {
  id: string;
  course_id: string;
  name: string;
  description?: string;
  max_students?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  student_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateClassDTO {
  name: string;
  description?: string;
  max_students?: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdateClassDTO {
  name?: string;
  description?: string;
  status?: string;
  max_students?: number;
}

export interface ClassTeacher {
  teacher_id: string;
  role: string;
  name?: string;
  email?: string;
}

export interface ClassStudent {
  student_id: string;
  name?: string;
  email?: string;
}

interface ClassStudentApiResponse {
  student_id: string;
  user_name: string;
  full_name?: string;
  email?: string;
}

interface ClassStudentListApiResponse {
  students: ClassStudentApiResponse[];
  total: number;
  page: number;
  page_size: number;
}

function mapClassStudents(response: ClassStudentListApiResponse): ClassStudent[] {
  return response.students.map((student) => ({
    student_id: student.student_id,
    name: student.full_name?.trim() || student.user_name,
    email: student.email,
  }));
}

export interface Attendance {
  id: string;
  class_id: string;
  student_id: string;
  student_name?: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  note?: string;
  created_at?: string;
}

export interface CreateAttendanceDTO {
  student_id: string;
  date: string;
  status: "present" | "absent";
  note?: string;
}

export interface UpdateAttendanceDTO {
  status?: string;
  note?: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const classService = {
  // ── Classes CRUD ──────────────────────────────────────────────────────────

  /** GET /courses/:courseId/classes */
  list: (courseId: string) =>
    api.get<R<Class[]>>(`/courses/${courseId}/classes`).then((r) => r.data.data),

  /** GET /courses/:courseId/classes/:classId */
  getById: (courseId: string, classId: string) =>
    api.get<R<Class>>(`/courses/${courseId}/classes/${classId}`).then((r) => r.data.data),

  /** POST /courses/:courseId/classes */
  create: (courseId: string, data: CreateClassDTO) =>
    api.post<R<Class>>(`/courses/${courseId}/classes`, data).then((r) => r.data.data),

  /** PUT /courses/:courseId/classes/:classId */
  update: (courseId: string, classId: string, data: UpdateClassDTO) =>
    api.put<R<Class>>(`/courses/${courseId}/classes/${classId}`, data).then((r) => r.data.data),

  /** DELETE /courses/:courseId/classes/:classId */
  delete: (courseId: string, classId: string) =>
    api.delete<R<null>>(`/courses/${courseId}/classes/${classId}`).then((r) => r.data),

  // ── Teachers ──────────────────────────────────────────────────────────────

  /** POST /courses/:courseId/classes/:classId/teachers */
  addTeacher: (courseId: string, classId: string, teacherId: string, role = "primary") =>
    api
      .post<R<null>>(`/courses/${courseId}/classes/${classId}/teachers`, {
        teacher_id: teacherId,
        role,
      })
      .then((r) => r.data),

  /** DELETE /courses/:courseId/classes/:classId/teachers/:teacherId */
  removeTeacher: (courseId: string, classId: string, teacherId: string) =>
    api
      .delete<R<null>>(`/courses/${courseId}/classes/${classId}/teachers/${teacherId}`)
      .then((r) => r.data),

  /** GET /courses/:courseId/classes/:classId/teachers */
  getTeachers: (courseId: string, classId: string) =>
    api
      .get<R<ClassTeacher[]>>(`/courses/${courseId}/classes/${classId}/teachers`)
      .then((r) => r.data.data),

  // ── Students ──────────────────────────────────────────────────────────────

  /** POST /courses/:courseId/classes/:classId/students */
  addStudent: (courseId: string, classId: string, studentId: string) =>
    api
      .post<R<null>>(`/courses/${courseId}/classes/${classId}/students`, {
        student_id: studentId,
      })
      .then((r) => r.data),

  /** DELETE /courses/:courseId/classes/:classId/students/:studentId */
  removeStudent: (courseId: string, classId: string, studentId: string) =>
    api
      .delete<R<null>>(`/courses/${courseId}/classes/${classId}/students/${studentId}`)
      .then((r) => r.data),

  /** GET /courses/:courseId/classes/:classId/students */
  getStudents: (courseId: string, classId: string) =>
    api
      .get<R<ClassStudentListApiResponse>>(
        `/courses/${courseId}/classes/${classId}/students`,
        { params: { page: 1, page_size: 100 } }
      )
      .then((r) => mapClassStudents(r.data.data)),

  /**
   * GET /classes/:classId/students — cùng handler với getStudents nhưng KHÔNG
   * cần courseId (backend đăng ký cả hai dạng: class_router.go:35 và
   * course_router.go:55). Dùng cho màn hình chỉ có classId trong URL, vd.
   * trang điểm danh — tránh phải fetch class chỉ để lấy course_id.
   */
  getStudentsByClassId: (classId: string) =>
    api
      .get<R<ClassStudentListApiResponse>>(`/classes/${classId}/students`, {
        params: { page: 1, page_size: 100 },
      })
      .then((r) => mapClassStudents(r.data.data)),

  // ── Content Schedule ──────────────────────────────────────────────────────

  /** GET /courses/:courseId/classes/:classId/contents */
  getContents: (courseId: string, classId: string, params?: { page?: number; page_size?: number }) =>
    api
      .get<R<{ contents: unknown[]; total: number }>>(
        `/courses/${courseId}/classes/${classId}/contents`,
        { params }
      )
      .then((r) => r.data.data),

  // ── Attendances ───────────────────────────────────────────────────────────

  /** POST /courses/:courseId/classes/:classId/attendances */
  createAttendance: (courseId: string, classId: string, data: CreateAttendanceDTO) =>
    api
      .post<R<Attendance>>(`/courses/${courseId}/classes/${classId}/attendances`, data)
      .then((r) => r.data.data),

  /** GET /courses/:courseId/classes/:classId/attendances */
  getAttendances: (courseId: string, classId: string) =>
    api
      .get<R<Attendance[]>>(`/courses/${courseId}/classes/${classId}/attendances`)
      .then((r) => r.data.data),

  /** GET /courses/:courseId/classes/:classId/attendances/:attendanceId */
  getAttendance: (courseId: string, classId: string, attendanceId: string) =>
    api
      .get<R<Attendance>>(
        `/courses/${courseId}/classes/${classId}/attendances/${attendanceId}`
      )
      .then((r) => r.data.data),

  /** PUT /courses/:courseId/classes/:classId/attendances/:attendanceId */
  updateAttendance: (courseId: string, classId: string, attendanceId: string, data: UpdateAttendanceDTO) =>
    api
      .put<R<Attendance>>(
        `/courses/${courseId}/classes/${classId}/attendances/${attendanceId}`,
        data
      )
      .then((r) => r.data.data),

  /** DELETE /courses/:courseId/classes/:classId/attendances/:attendanceId */
  deleteAttendance: (courseId: string, classId: string, attendanceId: string) =>
    api
      .delete<R<null>>(
        `/courses/${courseId}/classes/${classId}/attendances/${attendanceId}`
      )
      .then((r) => r.data),
};
