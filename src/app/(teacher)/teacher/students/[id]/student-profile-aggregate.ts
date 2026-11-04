/**
 * Hồ sơ học viên gom MỌI dòng ghi danh của học viên (Q3-07).
 *
 * GET /teachers/me/students trả 1 dòng cho mỗi (học viên, khoá/lớp). Trang hồ sơ từng chỉ lấy dòng
 * đầu tiên nên học viên học 2 khoá chỉ hiện 1 khoá/lớp và thiếu bạn cùng lớp của khoá còn lại.
 * Tái dùng `groupStudents` (cùng quy tắc trạng thái chung với trang danh sách) rồi bổ sung bạn cùng lớp.
 */

import type { TeacherStudent } from "@/services/teacher.service";
import { groupStudents, type GroupedStudent } from "../group-students";

export interface StudentClassmate {
  id: string;
  name: string;
  studentId?: string;
  parentPhone?: string;
}

export interface StudentProfile extends GroupedStudent {
  classmates: StudentClassmate[];
}

/** null nếu không có dòng nào của học viên này. */
export function buildStudentProfile(rows: TeacherStudent[], studentId: string): StudentProfile | null {
  const student = groupStudents(rows.filter((r) => r.id === studentId))[0];
  if (!student) return null;

  // `class_id` optional (học viên ghi danh thẳng vào khoá): so `undefined === undefined` sẽ gộp nhầm mọi
  // học viên "chưa có lớp" thành bạn cùng lớp, nên chỉ xét các lớp có id thật.
  const classIds = new Set(
    rows.filter((r) => r.id === studentId && r.class_id).map((r) => r.class_id as string)
  );
  const classmates = new Map<string, StudentClassmate>();
  for (const r of rows) {
    if (r.id === studentId || !r.class_id || !classIds.has(r.class_id)) continue;
    if (!classmates.has(r.id)) {
      classmates.set(r.id, { id: r.id, name: r.name, studentId: r.student_id, parentPhone: r.parent_phone });
    }
  }
  return { ...student, classmates: Array.from(classmates.values()) };
}
