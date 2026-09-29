/**
 * Gom danh sách học viên của giảng viên theo HỌC VIÊN (QA vòng 2, D6).
 *
 * GET /teachers/me/students trả 1 dòng cho MỖI (học viên, khoá/lớp) — học viên học 2 khoá của
 * cùng giảng viên xuất hiện 2 lần, cùng `id`, nên bảng lặp dòng và React báo trùng `key`, còn
 * chọn 1 dòng là chọn luôn dòng kia. Ở đây gộp về 1 dòng/học viên, giữ danh sách khoá đã ghi danh.
 */

import type { TeacherStudent } from "@/services/teacher.service";

export interface StudentCourse {
  courseId?: string;
  courseName: string;
  className?: string;
  status: string;
}

export interface GroupedStudent {
  id: string;
  name: string;
  studentId?: string;
  parentName?: string;
  parentPhone?: string;
  courses: StudentCourse[];
  /** active nếu còn học ít nhất 1 khoá; graduated nếu mọi khoá đã hoàn thành; còn lại inactive. */
  status: "active" | "graduated" | "inactive";
}

function overallStatus(courses: StudentCourse[]): GroupedStudent["status"] {
  if (courses.some((c) => c.status === "active")) return "active";
  if (courses.length > 0 && courses.every((c) => c.status === "graduated")) return "graduated";
  return "inactive";
}

export function groupStudents(rows: TeacherStudent[]): GroupedStudent[] {
  const byId = new Map<string, GroupedStudent>();
  for (const row of rows) {
    let student = byId.get(row.id);
    if (!student) {
      student = {
        id: row.id,
        name: row.name,
        studentId: row.student_id,
        parentName: row.parent_name,
        parentPhone: row.parent_phone,
        courses: [],
        status: "inactive",
      };
      byId.set(row.id, student);
    }
    // Phụ huynh có thể chỉ có ở một trong các dòng — lấy giá trị đầu tiên khác rỗng.
    student.parentName ??= row.parent_name;
    student.parentPhone ??= row.parent_phone;
    student.studentId ??= row.student_id;

    const courseName = row.course_name || row.class_name || "Khoá học không rõ tên";
    const duplicate = student.courses.some(
      (c) => c.courseId === row.course_id && c.className === row.class_name
    );
    if (!duplicate) {
      student.courses.push({ courseId: row.course_id, courseName, className: row.class_name, status: row.status });
    }
  }
  const result = Array.from(byId.values());
  for (const s of result) s.status = overallStatus(s.courses);
  return result;
}

/** Tên khoá (duy nhất, theo thứ tự xuất hiện) cho bộ lọc "Khoá học". */
export function courseFilterOptions(students: GroupedStudent[]): string[] {
  const names = new Set<string>();
  for (const s of students) for (const c of s.courses) names.add(c.courseName);
  return Array.from(names);
}
