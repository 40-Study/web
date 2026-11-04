/**
 * Class management type definitions
 */

export interface ClassMember {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
  avatar?: string;
  joined_at?: string;
}

export interface ClassEntity {
  id: string;
  name: string;
  code: string;
  description?: string;
  /** Vắng hoặc null = lớp cá nhân của giảng viên (không thuộc tổ chức). */
  organization_id?: string | null;
  teacher_ids: string[];
  student_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateClassDTO {
  name: string;
  code: string;
  description?: string;
  /** Bỏ trống hoặc null = tạo lớp cá nhân. */
  organization_id?: string | null;
}

export interface UpdateClassDTO extends Partial<CreateClassDTO> {}

/** Student info as seen by teacher */
export interface TeacherStudent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  student_id?: string; // Mã học sinh
  parent_name?: string;
  parent_phone?: string;
  class_id: string;
  class_name: string;
  course_id?: string;
  course_name?: string;
  status: "active" | "inactive" | "graduated";
  progress?: number;
  last_active?: string;
  enrolled_at?: string;
}
