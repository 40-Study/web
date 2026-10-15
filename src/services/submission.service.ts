/**
 * Submission service — code submission, run, and results
 * Endpoints: /submissions
 */

import { api } from "@/lib/api-client";
import type { SubmissionVerdict as CodeEditorVerdict } from "@/services/exercise.service";

// ─── Types ──────────────────────────────────────────────────────────────────

export type SubmissionVerdict =
  | "pending"
  | "running"
  | "accepted"
  | "wrong_answer"
  | "time_limit_exceeded"
  | "memory_limit_exceeded"
  | "runtime_error"
  | "compilation_error";

export interface SubmissionUserDTO {
  id: string;
  username: string;
  /** Họ tên (backend bỏ trống khi người dùng chưa nhập). */
  full_name?: string;
}

export interface SubmissionResponseDTO {
  id: string;
  assignment_id: string;
  user_id: string;
  user?: SubmissionUserDTO;
  language: string;
  code: string;
  verdict: SubmissionVerdict;
  score: number;
  execution_time: number;
  memory_used: number;
  test_cases_passed: number;
  total_test_cases: number;
  created_at: string;
}

export interface SubmissionListDTO {
  data: SubmissionResponseDTO[];
  total: number;
  page: number;
  page_size: number;
}

export interface SubmitCodeDTO {
  assignment_id: string;
  user_id?: string;
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
  custom_input: string;
}

export interface RunResultDTO {
  output?: string;
  error?: string;
  execution_time?: number;
  memory_used?: number;
  status: string;
}

/** POST /submissions/execute (E1): chạy code tự do (sandbox, nút Run của bài tập). */
export interface ExecuteRequest {
  /** khoá trong `RUNNABLE_LANGUAGES` */
  language: string;
  code: string;
  stdin: string;
}

/** Payload thô của E1 (không bọc `{message, data}`). */
export interface ExecuteResult {
  stdout: string;
  stderr: string;
  compile_output: string;
  /** compile output nhắc lại cho client cũ; có thể vắng */
  error?: string;
  exit_code: number;
  time: string;
  memory: number;
  /** verdict (contract sec. 2) */
  status: CodeEditorVerdict;
  /** id trạng thái Judge0 (1-14) */
  status_id: number;
}

/** Một dòng của GET /submissions/languages (E2). */
export interface RunnableLanguageOption {
  key: string;
  label: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const submissionService = {
  /** POST /submissions — submit code for grading */
  submit: (dto: SubmitCodeDTO) =>
    api.post<R<SubmissionResponseDTO>>("/submissions", dto).then((r) => r.data.data),

  /** POST /submissions/run — run code against test cases */
  run: (dto: RunCodeDTO) =>
    api.post<R<RunResultDTO>>("/submissions/run", dto).then((r) => r.data.data),

  /** POST /submissions/run-custom — run code with custom input */
  runCustom: (dto: RunCustomInputDTO) =>
    api.post<R<RunResultDTO>>("/submissions/run-custom", dto).then((r) => r.data.data),

  /** GET /submissions/:id — get submission details */
  getById: (id: string) =>
    api.get<R<SubmissionResponseDTO>>(`/submissions/${id}`).then((r) => r.data.data),

  /** GET /submissions/assignment/:assignmentId — all submissions (paginated) */
  getByAssignment: (assignmentId: string, page = 1, pageSize = 100) =>
    api
      .get<SubmissionListDTO>(`/submissions/assignment/${assignmentId}`, {
        params: { page, page_size: pageSize },
      })
      .then((r) => r.data),

  /** GET /submissions/my/:assignmentId — current user's submissions */
  getMySubmissions: (assignmentId: string) =>
    api
      .get<R<SubmissionResponseDTO[]>>(`/submissions/my/${assignmentId}`)
      .then((r) => r.data.data),

  /** POST /submissions/execute (E1) — payload thô, KHÔNG `.data.data`; lỗi mang `ApiError.code` */
  execute: (body: ExecuteRequest) =>
    api.post<ExecuteResult>("/submissions/execute", body).then((r) => r.data),

  /** GET /submissions/languages (E2) — payload thô */
  getRunnableLanguages: () =>
    api.get<RunnableLanguageOption[]>("/submissions/languages").then((r) => r.data),

  /** GET /submissions/user/:userId — all submissions by a user */
  getByUser: (userId: string) =>
    api
      .get<R<SubmissionResponseDTO[]>>(`/submissions/user/${userId}`)
      .then((r) => r.data.data),
};
