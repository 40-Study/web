/**
 * Assignment service — live assignments in livestream sessions
 * Endpoints: /assignments
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type DifficultyLevel = "easy" | "medium" | "hard";
export type ProgrammingLanguage = string;

export interface AssignmentResponseDTO {
  id: string;
  session_id: string;
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
  created_at: string;
}

export interface AssignmentListDTO {
  assignments: AssignmentResponseDTO[];
  total: number;
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
  session_id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  language: ProgrammingLanguage[];
  starter_code?: string;
  time_limit?: number;
  memory_limit?: number;
  duration_minutes?: number;
  show_in_recap?: boolean;
}

export type UpdateAssignmentDTO = Partial<Omit<CreateAssignmentDTO, "session_id">>;

export interface CreateTestCaseDTO {
  input: string;
  expected_output: string;
  is_hidden?: boolean;
  display_order?: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const assignmentService = {
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
