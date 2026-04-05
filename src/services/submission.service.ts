/**
 * Submission service — code submission, run, and sandbox execution
 */

import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SubmissionStatus =
  | "pending"
  | "running"
  | "accepted"
  | "wrong_answer"
  | "time_limit_exceeded"
  | "memory_limit_exceeded"
  | "runtime_error"
  | "compilation_error";

export interface TestCaseResult {
  test_case_id: string;
  passed: boolean;
  input?: string;
  expected_output?: string;
  actual_output?: string;
  execution_time?: number;
  memory_used?: number;
  error?: string;
}

export interface SubmissionResponseDTO {
  id: string;
  assignment_id: string;
  user_id: string;
  language: string;
  code: string;
  status: SubmissionStatus;
  score?: number;
  execution_time?: number;
  memory_used?: number;
  test_results?: TestCaseResult[];
  error_message?: string;
  submitted_at: string;
}

export interface SubmitCodeDTO {
  assignment_id: string;
  language: string;
  code: string;
}

export interface RunCodeDTO {
  assignment_id: string;
  language: string;
  code: string;
}

export interface RunCustomInputDTO {
  assignment_id: string;
  language: string;
  code: string;
  input: string;
}

export interface ExecuteCodeDTO {
  language: string;
  code: string;
  input?: string;
}

export interface RunResultDTO {
  output?: string;
  error?: string;
  execution_time?: number;
  memory_used?: number;
  status: string;
}

type ApiResponse<T> = { message: string; data: T };

// ─── Service ─────────────────────────────────────────────────────────────────

export const submissionService = {
  /** POST /submissions/ — submit code for grading */
  submit: (dto: SubmitCodeDTO) =>
    api
      .post<ApiResponse<SubmissionResponseDTO>>("/submissions/", dto)
      .then((r) => r.data.data),

  /** POST /submissions/run — run code against test cases */
  run: (dto: RunCodeDTO) =>
    api
      .post<ApiResponse<RunResultDTO>>("/submissions/run", dto)
      .then((r) => r.data.data),

  /** POST /submissions/run-custom — run code with custom input */
  runCustom: (dto: RunCustomInputDTO) =>
    api
      .post<ApiResponse<RunResultDTO>>("/submissions/run-custom", dto)
      .then((r) => r.data.data),

  /** POST /submissions/execute — free sandbox execution (no assignment) */
  execute: (dto: ExecuteCodeDTO) =>
    api
      .post<ApiResponse<RunResultDTO>>("/submissions/execute", dto)
      .then((r) => r.data.data),

  /** GET /submissions/:id — get submission details */
  getById: (id: string) =>
    api
      .get<ApiResponse<SubmissionResponseDTO>>(`/submissions/${id}`)
      .then((r) => r.data.data),

  /** GET /submissions/assignment/:assignmentId — all submissions for an assignment */
  getByAssignment: (assignmentId: string) =>
    api
      .get<ApiResponse<SubmissionResponseDTO[]>>(`/submissions/assignment/${assignmentId}`)
      .then((r) => r.data.data),

  /** GET /submissions/my/:assignmentId — current user's submissions for an assignment */
  getMySubmissions: (assignmentId: string) =>
    api
      .get<ApiResponse<SubmissionResponseDTO[]>>(`/submissions/my/${assignmentId}`)
      .then((r) => r.data.data),
};
