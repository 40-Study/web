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

  /** DELETE /exercises/:exerciseId/testcases/:testcaseId */
  deleteTestCase: (exerciseId: string, testcaseId: string) =>
    api
      .delete<R<null>>(`/exercises/${exerciseId}/testcases/${testcaseId}`)
      .then((r) => r.data),

  // ── Submissions ───────────────────────────────────────────────────────────

  /** POST /exercises/:exerciseId/submit */
  submit: (exerciseId: string, data: ExerciseSubmissionDTO) =>
    api
      .post<R<ExerciseSubmission>>(`/exercises/${exerciseId}/submit`, data)
      .then((r) => r.data.data),

  /** GET /exercises/:exerciseId/submissions */
  getSubmissions: (exerciseId: string, params?: { page?: number; page_size?: number }) =>
    api
      .get<R<{ submissions: ExerciseSubmission[]; total: number }>>(
        `/exercises/${exerciseId}/submissions`,
        { params }
      )
      .then((r) => r.data.data),
};
