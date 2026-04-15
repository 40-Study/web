/**
 * Grade service — grade columns, grades, and final grades
 * Endpoints: /classes/:classId/grade-columns, /classes/:classId/grades, /grades/:id
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type GradeType = "assignment" | "quiz" | "midterm" | "final" | "attendance" | "participation" | "other";

export interface GradeColumn {
  id: string;
  class_id: string;
  name: string;
  grade_type: GradeType;
  weight: number;
  max_score: number;
  display_order: number;
  is_required?: boolean;
  created_at?: string;
}

export interface CreateGradeColumnDTO {
  name: string;
  grade_type: GradeType;
  weight: number;
  max_score: number;
  display_order?: number;
  is_required?: boolean;
}

export interface UpdateGradeColumnDTO {
  name?: string;
  weight?: number;
  max_score?: number;
  is_required?: boolean;
}

export interface Grade {
  id: string;
  class_id: string;
  student_id: string;
  grade_type: GradeType;
  title?: string;
  score: number;
  max_score: number;
  weight?: number;
  feedback?: string;
  is_final?: boolean;
  graded_at?: string;
  student?: {
    id: string;
    name: string;
    email?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CreateGradeDTO {
  student_id: string;
  grade_type: GradeType;
  title?: string;
  score: number;
  max_score: number;
  weight?: number;
  feedback?: string;
}

export interface BulkCreateGradeDTO {
  grades: CreateGradeDTO[];
}

export interface UpdateGradeDTO {
  score?: number;
  feedback?: string;
  is_final?: boolean;
}

export interface FinalGrade {
  id: string;
  class_id: string;
  student_id: string;
  weighted_score: number;
  letter_grade?: string;
  gpa?: number;
  notes?: string;
  is_finalized?: boolean;
  finalized_at?: string;
  student?: {
    id: string;
    name: string;
    email?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface UpdateFinalGradeDTO {
  letter_grade?: string;
  gpa?: number;
  notes?: string;
}

export interface GradeBookResponse {
  columns: GradeColumn[];
  grades: Grade[];
  students: Array<{
    id: string;
    name: string;
    email?: string;
    grades: Record<string, number>;
    weighted_total?: number;
  }>;
}

export interface MyGradesResponse {
  classes: Array<{
    class_id: string;
    class_name: string;
    course_name?: string;
    grades: Grade[];
    final_grade?: FinalGrade;
  }>;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const gradeService = {
  // ── Grade Columns ─────────────────────────────────────────────────────────

  /** POST /classes/:classId/grade-columns */
  createColumn: (classId: string, data: CreateGradeColumnDTO) =>
    api.post<R<GradeColumn>>(`/classes/${classId}/grade-columns`, data).then((r) => r.data.data),

  /** GET /classes/:classId/grade-columns */
  getColumns: (classId: string) =>
    api.get<R<GradeColumn[]>>(`/classes/${classId}/grade-columns`).then((r) => r.data.data),

  /** PUT /classes/:classId/grade-columns/:columnId */
  updateColumn: (classId: string, columnId: string, data: UpdateGradeColumnDTO) =>
    api
      .put<R<GradeColumn>>(`/classes/${classId}/grade-columns/${columnId}`, data)
      .then((r) => r.data.data),

  /** PUT /classes/:classId/grade-columns/reorder */
  reorderColumns: (classId: string, columnIds: string[]) =>
    api
      .put<R<null>>(`/classes/${classId}/grade-columns/reorder`, { column_ids: columnIds })
      .then((r) => r.data),

  /** DELETE /classes/:classId/grade-columns/:columnId */
  deleteColumn: (classId: string, columnId: string) =>
    api.delete<R<null>>(`/classes/${classId}/grade-columns/${columnId}`).then((r) => r.data),

  // ── Grades ────────────────────────────────────────────────────────────────

  /** POST /classes/:classId/grades */
  createGrade: (classId: string, data: CreateGradeDTO) =>
    api.post<R<Grade>>(`/classes/${classId}/grades`, data).then((r) => r.data.data),

  /** POST /classes/:classId/grades/bulk */
  bulkCreateGrades: (classId: string, data: BulkCreateGradeDTO) =>
    api.post<R<Grade[]>>(`/classes/${classId}/grades/bulk`, data).then((r) => r.data.data),

  /** GET /classes/:classId/grades — grade book */
  getGradeBook: (classId: string) =>
    api.get<R<GradeBookResponse>>(`/classes/${classId}/grades`).then((r) => r.data.data),

  /** GET /classes/:classId/grades/student/:studentId */
  getStudentGrades: (classId: string, studentId: string) =>
    api
      .get<R<Grade[]>>(`/classes/${classId}/grades/student/${studentId}`)
      .then((r) => r.data.data),

  /** PUT /grades/:gradeId */
  updateGrade: (gradeId: string, data: UpdateGradeDTO) =>
    api.put<R<Grade>>(`/grades/${gradeId}`, data).then((r) => r.data.data),

  /** DELETE /grades/:gradeId */
  deleteGrade: (gradeId: string) =>
    api.delete<R<null>>(`/grades/${gradeId}`).then((r) => r.data),

  // ── Final Grades ──────────────────────────────────────────────────────────

  /** POST /classes/:classId/final-grades/calculate */
  calculateFinalGrades: (classId: string) =>
    api.post<R<FinalGrade[]>>(`/classes/${classId}/final-grades/calculate`, {}).then((r) => r.data.data),

  /** GET /classes/:classId/final-grades */
  getFinalGrades: (classId: string) =>
    api.get<R<FinalGrade[]>>(`/classes/${classId}/final-grades`).then((r) => r.data.data),

  /** PUT /classes/:classId/final-grades/:finalGradeId */
  updateFinalGrade: (classId: string, finalGradeId: string, data: UpdateFinalGradeDTO) =>
    api
      .put<R<FinalGrade>>(`/classes/${classId}/final-grades/${finalGradeId}`, data)
      .then((r) => r.data.data),

  /** POST /classes/:classId/final-grades/finalize */
  finalizeFinalGrades: (classId: string) =>
    api.post<R<null>>(`/classes/${classId}/final-grades/finalize`, {}).then((r) => r.data),

  // ── My Grades ─────────────────────────────────────────────────────────────

  /** GET /me/grades */
  getMyGrades: () =>
    api.get<R<MyGradesResponse>>("/me/grades").then((r) => r.data.data),

  /** GET /me/grades/class/:classId */
  getMyGradesInClass: (classId: string) =>
    api.get<R<Grade[]>>(`/me/grades/class/${classId}`).then((r) => r.data.data),
};
