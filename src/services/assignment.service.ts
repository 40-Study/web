/**
 * Assignment service — live assignments in livestream sessions
 * Endpoints: /assignments
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type DifficultyLevel = "easy" | "medium" | "hard";
export type ProgrammingLanguage = string;

export type AssignmentType = "live_coding" | "homework" | "project";

export interface AssignmentResponseDTO {
  id: string;
  session_id?: string;
  class_id?: string;
  type: AssignmentType;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  language: ProgrammingLanguage[];
  starter_code: string;
  time_limit: number;
  memory_limit: number;
  duration_minutes: number;
  is_published: boolean;
  published_at?: string;
  start_time?: string;
  end_time?: string;
  show_in_recap: boolean;
  allow_late_submission: boolean;
  late_penalty_percent: number;
  max_late_days: number;
  grace_period_minutes: number;
  created_at: string;
}

/** Envelope thật của GET /assignments?session_id= — không bọc thêm {message,data} */
export interface AssignmentListDTO {
  data: AssignmentResponseDTO[];
  total: number;
  page: number;
  page_size: number;
}

export interface SandboxResponseDTO {
  sandbox_url: string;
  token?: string;
  expires_at?: string;
}

export interface TestCaseResponseDTO {
  id: string;
  assignment_id: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
  display_order: number;
}

export interface CreateAssignmentDTO {
  /** Bắt buộc cho type="live_coding" (gắn vào 1 buổi livestream cụ thể) */
  session_id?: string;
  /** Bắt buộc cho type="homework"/"project" (giao theo lớp, không cần buổi live) */
  class_id?: string;
  type?: AssignmentType;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  language: ProgrammingLanguage[];
  starter_code?: string;
  time_limit?: number;
  memory_limit?: number;
  start_time?: string;
  end_time?: string;
  allow_late_submission?: boolean;
  late_penalty_percent?: number;
  max_late_days?: number;
  grace_period_minutes?: number;
}

export type UpdateAssignmentDTO = Partial<
  Pick<
    CreateAssignmentDTO,
    | "title"
    | "description"
    | "difficulty"
    | "language"
    | "starter_code"
    | "time_limit"
    | "memory_limit"
    | "start_time"
    | "end_time"
  >
>;

export interface CreateTestCaseDTO {
  input: string;
  expected_output: string;
  is_hidden?: boolean;
  display_order?: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const assignmentService = {
  /** GET /assignments?session_id=&page=&page_size= — trả raw {data,total,page,page_size} */
  getBySession: (sessionId: string, page = 1, pageSize = 50) =>
    api
      .get<AssignmentListDTO>("/assignments", { params: { session_id: sessionId, page, page_size: pageSize } })
      .then((r) => r.data),

  /** POST /assignments — create */
  create: (dto: CreateAssignmentDTO) =>
    api.post<R<AssignmentResponseDTO>>("/assignments", dto).then((r) => r.data.data),

  /** GET /assignments/:id */
  getById: (id: string) =>
    api.get<R<AssignmentResponseDTO>>(`/assignments/${id}`).then((r) => r.data.data),

  /** GET /assignments/:id/sandbox */
  getSandbox: (id: string) =>
    api.get<R<SandboxResponseDTO>>(`/assignments/${id}/sandbox`).then((r) => r.data.data),

  /** PUT /assignments/:id */
  update: (id: string, dto: UpdateAssignmentDTO) =>
    api.put<R<AssignmentResponseDTO>>(`/assignments/${id}`, dto).then((r) => r.data.data),

  /** DELETE /assignments/:id */
  delete: (id: string) =>
    api.delete<R<null>>(`/assignments/${id}`).then((r) => r.data),

  /** POST /assignments/:id/publish — publish with session_id */
  publish: (id: string, sessionId: string) =>
    api
      .post<R<AssignmentResponseDTO>>(`/assignments/${id}/publish`, { session_id: sessionId })
      .then((r) => r.data.data),

  /** POST /assignments/:id/unpublish */
  unpublish: (id: string) =>
    api.post<R<null>>(`/assignments/${id}/unpublish`, {}).then((r) => r.data),

  // ── Test Cases ────────────────────────────────────────────────────────────

  /** GET /assignments/:id/testcases */
  getTestCases: (id: string) =>
    api.get<R<TestCaseResponseDTO[]>>(`/assignments/${id}/testcases`).then((r) => r.data.data),

  /** POST /assignments/:id/testcases */
  createTestCase: (id: string, data: CreateTestCaseDTO) =>
    api
      .post<R<TestCaseResponseDTO>>(`/assignments/${id}/testcases`, data)
      .then((r) => r.data.data),

  /** POST /assignments/:id/testcases/import — bulk import */
  importTestCases: (id: string, testCases: CreateTestCaseDTO[]) =>
    api
      .post<R<TestCaseResponseDTO[]>>(`/assignments/${id}/testcases/import`, {
        test_cases: testCases,
      })
      .then((r) => r.data.data),

  /** DELETE /assignments/:id/testcases/:testcaseId */
  deleteTestCase: (id: string, testcaseId: string) =>
    api.delete<R<null>>(`/assignments/${id}/testcases/${testcaseId}`).then((r) => r.data),
};
