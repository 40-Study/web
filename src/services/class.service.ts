/**
 * Class service — classes nested under courses
 * Endpoints: /courses/:courseId/classes, teachers, students, attendances, contents
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Class {
  id: string;
  course_id: string;
  /** Tổ chức mà lớp thuộc về; vắng = lớp cá nhân của giảng viên. */
  organization_id?: string;
  name: string;
  description?: string;
  max_students?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  student_count?: number;
  teacher_count?: number;
  /**
   * Chỉ có ở chi tiết lớp (GET /classes/:id), do backend tính bằng đúng hàm kiểm của thao tác ghi.
   * Vắng = không có quyền; UI không được tự suy ra quyền từ vai trò.
   */
  can_manage?: boolean;
  can_assign_teachers?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Một dòng giảng viên của lớp (GET /classes/:id/teachers). */
export interface ClassTeacherRow {
  teacher_id: string;
  role: string;
  name: string;
}

/** Một dòng học viên của lớp, kèm trạng thái ghi danh. */
export interface ClassStudentRow {
  student_id: string;
  name: string;
  status?: string;
  enrolled_at?: string;
}

/** Ứng viên ghi danh (GET /classes/:id/enrollable-students): không có email. */
export interface EnrollableStudent {
  id: string;
  name: string;
}

export interface ClassPage<T> {
  items: T[];
  total: number;
}

export interface CreateClassDTO {
  name: string;
  description?: string;
  /** Tạo lớp trong tổ chức (người tạo phải là thành viên active). Bỏ trống = lớp cá nhân. */
  organization_id?: string;
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
  /** Không có email: học viên trong lớp không được thấy email giảng viên (Lane S3). */
}

/** Không có email: email học viên chỉ chính chủ và admin được thấy (Lane S2). */
export interface ClassStudent {
  student_id: string;
  name?: string;
}

interface ClassStudentApiResponse {
  student_id: string;
  user_name: string;
  full_name?: string;
  status?: string;
  enrolled_at?: string;
}

interface ClassTeacherApi {
  teacher_id: string;
  role: string;
  teacher?: { user_name: string; full_name?: string };
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

  // ── Quản lý lớp chỉ cần classId (khu tổ chức, lớp không gắn khoá) ───────────
  // Backend đăng ký cả /classes/:id/* lẫn /courses/:courseId/classes/:id/*, cùng một handler.

  /** GET /classes/:classId — kèm can_manage / can_assign_teachers. */
  getByClassId: (classId: string) =>
    api.get<R<Class>>(`/classes/${classId}`).then((r) => r.data.data),

  /** PUT /classes/:classId — kích hoạt lớp (draft → active), lưu trữ, đổi tên. */
  updateByClassId: (classId: string, data: UpdateClassDTO) =>
    api.put<R<Class>>(`/classes/${classId}`, data).then((r) => r.data.data),

  /** GET /classes/:classId/teachers */
  listTeachersByClassId: (classId: string) =>
    api
      .get<R<{ teachers: ClassTeacherApi[]; total: number }>>(`/classes/${classId}/teachers`, {
        params: { page: 1, page_size: 100 },
      })
      .then((r) =>
        r.data.data.teachers.map((t) => ({
          teacher_id: t.teacher_id,
          role: t.role,
          name: t.teacher?.full_name?.trim() || t.teacher?.user_name || "Giảng viên",
        }))
      ),

  /** POST /classes/:classId/teachers — chỉ chủ lớp / admin / chủ tổ chức (can_assign_teachers). */
  assignTeacherByClassId: (classId: string, teacherId: string, role = "primary") =>
    api.post<R<unknown>>(`/classes/${classId}/teachers`, { teacher_id: teacherId, role }).then((r) => r.data),

  /** GET /teachers?keyword= — ô chọn giảng viên để gán vào lớp (tìm theo tên, backend không trả email). */
  searchTeachers: (keyword: string) =>
    api
      .get<R<{ teachers: Array<{ id: string; user_name: string; full_name?: string }> }>>("/teachers", {
        params: { keyword, page: 1, page_size: 20 },
      })
      .then((r): EnrollableStudent[] =>
        r.data.data.teachers.map((t) => ({ id: t.id, name: t.full_name?.trim() || t.user_name }))
      ),

  /**
   * GET /classes/:classId/assignable-teachers?keyword= — giảng viên có thể gán vào lớp. Backend quyết danh sách: lớp của
   * tổ chức chỉ có giảng viên là thành viên tổ chức (admin hệ thống thấy tất cả), nên ô chọn không hiện người mà
   * việc gán sẽ bị từ chối.
   */
  searchAssignableTeachers: (classId: string, keyword: string) =>
    api
      .get<R<{ teachers: Array<{ id: string; user_name: string; full_name?: string }> }>>(
        `/classes/${classId}/assignable-teachers`,
        { params: { keyword } }
      )
      .then((r): EnrollableStudent[] =>
        r.data.data.teachers.map((t) => ({ id: t.id, name: t.full_name?.trim() || t.user_name }))
      ),

  /** DELETE /classes/:classId/teachers/:teacherId */
  removeTeacherByClassId: (classId: string, teacherId: string) =>
    api.delete<R<null>>(`/classes/${classId}/teachers/${teacherId}`).then((r) => r.data),

  /** GET /classes/:classId/students — kèm trạng thái ghi danh và tổng số. */
  listStudentsByClassId: (classId: string) =>
    api
      .get<R<ClassStudentListApiResponse>>(`/classes/${classId}/students`, {
        params: { page: 1, page_size: 100 },
      })
      .then(
        (r): ClassPage<ClassStudentRow> => ({
          total: r.data.data.total,
          items: r.data.data.students.map((s) => ({
            student_id: s.student_id,
            name: s.full_name?.trim() || s.user_name,
            status: s.status,
            enrolled_at: s.enrolled_at,
          })),
        })
      ),

  /** POST /classes/:classId/students */
  enrollStudentByClassId: (classId: string, studentId: string) =>
    api.post<R<unknown>>(`/classes/${classId}/students`, { student_id: studentId }).then((r) => r.data),

  /** DELETE /classes/:classId/students/:studentId */
  removeStudentByClassId: (classId: string, studentId: string) =>
    api.delete<R<null>>(`/classes/${classId}/students/${studentId}`).then((r) => r.data),

  /** GET /classes/:classId/enrollable-students?keyword= — học viên chưa học lớp này, tìm theo tên. */
  searchEnrollableStudents: (classId: string, keyword: string) =>
    api
      .get<R<{ students: Array<{ id: string; user_name: string; full_name?: string }> }>>(
        `/classes/${classId}/enrollable-students`,
        { params: { keyword } }
      )
      .then((r): EnrollableStudent[] =>
        r.data.data.students.map((s) => ({ id: s.id, name: s.full_name?.trim() || s.user_name }))
      ),

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
