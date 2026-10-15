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

export interface UpdateTestCaseDTO {
  input?: string;
  expected_output?: string;
  is_hidden?: boolean;
  display_order?: number;
}

/** GET /exercises/:id (E3): bài tập + test case (ca ẩn chỉ có với người quản lý). */
export interface ExerciseDetail extends Exercise {
  test_case_count?: number;
  test_cases: TestCase[];
}

/**
 * Verdict của bài nộp (contract sec. 2, SSOT backend `model.SubmissionVerdict`). Chỉ `pending` và `running`
 * là chưa kết thúc; `system_error` và `judge_unavailable` cho phép nộp lại.
 */
export const SUBMISSION_VERDICTS = [
  "pending",
  "running",
  "accepted",
  "wrong_answer",
  "compilation_error",
  "runtime_error",
  "time_limit_exceeded",
  "memory_limit_exceeded",
  "system_error",
  "judge_unavailable",
] as const;

export type SubmissionVerdict = (typeof SUBMISSION_VERDICTS)[number];

export const TERMINAL_VERDICTS: readonly SubmissionVerdict[] = SUBMISSION_VERDICTS.filter(
  (v) => v !== "pending" && v !== "running"
);

/** false cho pending/running và cho mọi chuỗi lạ (không ngừng poll vì một giá trị không biết). */
export function isTerminalVerdict(verdict: string): verdict is SubmissionVerdict {
  return (TERMINAL_VERDICTS as readonly string[]).includes(verdict);
}

/** Poll chi tiết bài nộp (E6) sau khi nộp (contract sec. 9). */
export const SUBMISSION_POLL_MS = 2000;
export const SUBMISSION_POLL_TIMEOUT_MS = 90000;

/** Người nộp, chỉ có trên danh sách của người quản lý (E7); không bao giờ có email. */
export interface SubmissionUserSummary {
  id: string;
  user_name: string;
  full_name: string;
}

export interface ExerciseSubmission {
  id: string;
  exercise_id: string;
  user_id: string;
  language: string;
  code: string;
  verdict: SubmissionVerdict;
  test_cases_passed: number;
  total_test_cases: number;
  execution_time_ms?: number;
  memory_used_kb?: number;
  error_message?: string;
  created_at: string;
  user?: SubmissionUserSummary;
}

/**
 * Kết quả một test case (E6). Với học viên, ca ẩn không có input/expected_output/actual_output/error_output.
 * `test_case_id` là null khi giảng viên đã xoá ca đó (lịch sử vẫn giữ).
 */
export interface ExerciseSubmissionResult {
  test_case_id: string | null;
  display_order: number;
  is_hidden: boolean;
  verdict: SubmissionVerdict;
  input?: string;
  expected_output?: string;
  actual_output?: string;
  error_output?: string;
  execution_time_ms?: number;
  memory_used_kb?: number;
}

export interface ExerciseSubmissionDetail extends ExerciseSubmission {
  results: ExerciseSubmissionResult[];
}

export interface ExerciseSubmissionList {
  data: ExerciseSubmission[];
  total: number;
  page: number;
  page_size: number;
}

export interface SubmissionListParams {
  page?: number;
  page_size?: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const exerciseService = {
  // ── Exercise CRUD ─────────────────────────────────────────────────────────

  /** POST /exercises */
  create: (data: CreateExerciseDTO) =>
    api.post<R<Exercise>>("/exercises", data).then((r) => r.data.data),

  /** GET /exercises/:exerciseId (E3) */
  getById: (exerciseId: string) =>
    api.get<R<ExerciseDetail>>(`/exercises/${exerciseId}`).then((r) => r.data.data),

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

  /** PUT /exercises/:exerciseId/testcases/:testcaseId (E10) — chỉ gửi field cần đổi */
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

  /** POST /exercises/:exerciseId/submit */
  submit: (exerciseId: string, data: ExerciseSubmissionDTO) =>
    api
      .post<R<ExerciseSubmission>>(`/exercises/${exerciseId}/submit`, data)
      .then((r) => r.data.data),

  /** GET /exercises/:exerciseId/my-submissions (E5) — bài nộp của chính người gọi */
  getMySubmissions: (exerciseId: string, params?: SubmissionListParams) =>
    api
      .get<R<ExerciseSubmissionList>>(`/exercises/${exerciseId}/my-submissions`, { params })
      .then((r) => r.data.data),

  /** GET /exercises/:exerciseId/submissions/:submissionId (E6) — chủ bài nộp hoặc người quản lý */
  getSubmissionDetail: (exerciseId: string, submissionId: string) =>
    api
      .get<R<ExerciseSubmissionDetail>>(`/exercises/${exerciseId}/submissions/${submissionId}`)
      .then((r) => r.data.data),

  /** GET /exercises/:exerciseId/submissions (E7) — người quản lý; lọc theo `user_id` tuỳ chọn */
  getSubmissions: (exerciseId: string, params?: SubmissionListParams & { user_id?: string }) =>
    api
      .get<R<ExerciseSubmissionList>>(`/exercises/${exerciseId}/submissions`, { params })
      .then((r) => r.data.data),
};
