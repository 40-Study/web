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
  organization_id: string;
  teacher_ids: string[];
  student_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateClassDTO {
  name: string;
  code: string;
  description?: string;
  organization_id: string;
}

export interface UpdateClassDTO extends Partial<CreateClassDTO> {}
