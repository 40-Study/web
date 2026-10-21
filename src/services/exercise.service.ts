/**
 * Course exercise service — coding exercises with test cases
 * Endpoints: /exercises
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
  language?: string[];
  starter_code?: string;
  time_limit?: number;
  memory_limit?: number;
  pass_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExerciseDTO {
  title: string;
  description?: string;
  difficulty?: string;
  language?: string[];
  starter_code?: string;
  time_limit?: number;
  memory_limit?: number;
  pass_percentage?: number;
}

export interface UpdateExerciseDTO {
  title?: string;
  description?: string;
  difficulty?: string;
  /** Giây cho mỗi test (backend `time_limit`, mặc định 2). */
  time_limit?: number;
  /** MB (backend `memory_limit`, mặc định 256). */
  memory_limit?: number;
  pass_percentage?: number;
}

export interface TestCase {
  id: string;
  exercise_id: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
  display_order: number;
}

export interface CreateTestCaseDTO {
  input: string;
  expected_output: string;
  is_hidden?: boolean;
  display_order?: number;
}

/**
 * Body của `PUT /exercises/:id/testcases/:testCaseId` — cùng khoá với lúc tạo; khoá vắng mặt = giữ nguyên.
 */
export type UpdateTestCaseDTO = Partial<CreateTestCaseDTO>;

export interface ExerciseSubmissionDTO {
  language: string;
  code: string;
}

export interface ExerciseSubmission {
  id: string;
  exercise_id: string;
  user_id: string;
  language: string;
  code: string;
  status: string;
  score?: number;
  created_at?: string;
}

/** Học viên gắn kèm mỗi bài nộp trong danh sách của giảng viên (`GET /exercises/:id/submissions`). */
export interface ExerciseSubmissionStudent {
  id: string;
  full_name: string;
  email: string;
}

/** Một bài nộp như backend trả (`ExerciseSubmissionResponseDTO`); `verdict` viết thường (`accepted`, `wrong_answer`…). */
export interface ExerciseSubmissionRecord {
  id: string;
  exercise_id: string;
  user_id: string;
  language: string;
  code: string;
  verdict: string;
  test_cases_passed: number;
  total_test_cases: number;
  execution_time_ms?: number | null;
  memory_used_kb?: number | null;
  error_message?: string | null;
  created_at: string;
  student?: ExerciseSubmissionStudent | null;
}

export interface ExerciseSubmissionPage {
  data: ExerciseSubmissionRecord[];
  total: number;
  page: number;
  page_size: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const exerciseService = {
  // ── Exercise CRUD ─────────────────────────────────────────────────────────

  /** POST /exercises */
  create: (data: CreateExerciseDTO) =>
    api.post<R<Exercise>>("/exercises", data).then((r) => r.data.data),

  /** GET /exercises/:exerciseId */
  getById: (exerciseId: string) =>
    api.get<R<Exercise>>(`/exercises/${exerciseId}`).then((r) => r.data.data),

  /** PUT /exercises/:exerciseId */
  update: (exerciseId: string, data: UpdateExerciseDTO) =>
    api.put<R<Exercise>>(`/exercises/${exerciseId}`, data).then((r) => r.data.data),

  /** DELETE /exercises/:exerciseId */
  delete: (exerciseId: string) =>
    api.delete<R<null>>(`/exercises/${exerciseId}`).then((r) => r.data),

  // ── Test Cases ────────────────────────────────────────────────────────────

  /** GET /exercises/:exerciseId/testcases */
  getTestCases: (exerciseId: string) =>
    api.get<R<TestCase[]>>(`/exercises/${exerciseId}/testcases`).then((r) => r.data.data),

  /** POST /exercises/:exerciseId/testcases */
  createTestCase: (exerciseId: string, data: CreateTestCaseDTO) =>
    api
      .post<R<TestCase>>(`/exercises/${exerciseId}/testcases`, data)
      .then((r) => r.data.data),

  /** POST /exercises/:exerciseId/testcases/import — bulk import test cases */
  importTestCases: (exerciseId: string, testCases: CreateTestCaseDTO[]) =>
    api
      .post<R<TestCase[]>>(`/exercises/${exerciseId}/testcases/import`, {
        test_cases: testCases,
      })
      .then((r) => r.data.data),

  /** PUT /exercises/:exerciseId/testcases/:testcaseId — sửa một test (giảng viên quản lý bài) */
  updateTestCase: (exerciseId: string, testcaseId: string, data: UpdateTestCaseDTO) =>
    api
      .put<R<TestCase>>(`/exercises/${exerciseId}/testcases/${testcaseId}`, data)
      .then((r) => r.data.data),

  /** DELETE /exercises/:exerciseId/testcases/:testcaseId */
  deleteTestCase: (exerciseId: string, testcaseId: string) =>
    api
      .delete<R<null>>(`/exercises/${exerciseId}/testcases/${testcaseId}`)
      .then((r) => r.data),

  // ── Submissions ───────────────────────────────────────────────────────────

  /**
   * GET /exercises/:exerciseId/submissions — bài nộp của MỌI học viên (chỉ người quản lý bài).
   * Backend trả `{ data, total, page, page_size }`; `data: null` (backend cũ) được chuẩn hoá thành `[]`.
   */
  getSubmissions: (exerciseId: string, params?: { page?: number; page_size?: number }) =>
    api
      .get<R<ExerciseSubmissionPage>>(`/exercises/${exerciseId}/submissions`, { params })
      .then((r): ExerciseSubmissionPage => ({ ...r.data.data, data: r.data.data?.data ?? [] })),
};
