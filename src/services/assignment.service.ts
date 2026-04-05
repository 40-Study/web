/**
 * Assignment service — CRUD for coding assignments in live sessions
 */

import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  order: number;
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

type ApiResponse<T> = { message: string; data: T };

// ─── Service ─────────────────────────────────────────────────────────────────

export const assignmentService = {
  /** GET /assignments/?session_id=X — list assignments for a session */
  getBySession: (sessionId: string) =>
    api
      .get<ApiResponse<AssignmentListDTO>>("/assignments/", { params: { session_id: sessionId } })
      .then((r) => r.data.data),

  /** GET /assignments/:id — single assignment details */
  getById: (id: string) =>
    api
      .get<ApiResponse<AssignmentResponseDTO>>(`/assignments/${id}`)
      .then((r) => r.data.data),

  /** GET /assignments/:id/sandbox — sandbox env for an assignment */
  getSandbox: (id: string) =>
    api
      .get<ApiResponse<SandboxResponseDTO>>(`/assignments/${id}/sandbox`)
      .then((r) => r.data.data),

  /** POST /assignments/ — create a new assignment */
  create: (dto: CreateAssignmentDTO) =>
    api
      .post<ApiResponse<AssignmentResponseDTO>>("/assignments/", dto)
      .then((r) => r.data.data),

  /** PUT /assignments/:id — update an assignment */
  update: (id: string, dto: UpdateAssignmentDTO) =>
    api
      .put<ApiResponse<AssignmentResponseDTO>>(`/assignments/${id}`, dto)
      .then((r) => r.data.data),

  /** DELETE /assignments/:id — delete an assignment */
  delete: (id: string) =>
    api
      .delete<ApiResponse<null>>(`/assignments/${id}`)
      .then((r) => r.data),

  /** POST /assignments/:id/publish — publish an assignment */
  publish: (id: string) =>
    api
      .post<ApiResponse<AssignmentResponseDTO>>(`/assignments/${id}/publish`, {})
      .then((r) => r.data.data),

  /** POST /assignments/:id/unpublish — unpublish an assignment */
  unpublish: (id: string) =>
    api
      .post<ApiResponse<AssignmentResponseDTO>>(`/assignments/${id}/unpublish`, {})
      .then((r) => r.data.data),

  /** GET /assignments/:id/testcases — list test cases for an assignment */
  getTestCases: (id: string) =>
    api
      .get<ApiResponse<TestCaseResponseDTO[]>>(`/assignments/${id}/testcases`)
      .then((r) => r.data.data),
};
