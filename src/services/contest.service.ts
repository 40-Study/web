import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ContestType = "CODING" | "QUIZ" | "MIXED";
export type ContestStatus = "DRAFT" | "UPCOMING" | "ACTIVE" | "ENDED" | "CANCELLED";
export type ProblemType = "CODE" | "MULTIPLE_CHOICE" | "SHORT_ANSWER";
export type SubmissionStatus =
  | "PENDING"
  | "JUDGING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT"
  | "MEMORY_LIMIT"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR";

export interface Contest {
  id: string;
  title: string;
  slug: string;
  description?: string;
  banner_url?: string;
  type: ContestType;
  status: ContestStatus;
  start_time: string;
  end_time: string;
  duration?: number;
  max_participants: number;
  participant_count: number;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  problems?: ContestProblem[];
  my_participation?: ContestParticipant;
}

export interface ContestProblem {
  id: string;
  contest_id: string;
  title: string;
  description: string;
  type: ProblemType;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  display_order: number;
  time_limit?: number;
  memory_limit?: number;
  input_format?: string;
  output_format?: string;
  sample_input?: string;
  sample_output?: string;
  options?: Record<string, string>;
  created_at: string;
}

export interface ContestParticipant {
  id: string;
  contest_id: string;
  user_id: string;
  user_name?: string;
  avatar_url?: string;
  total_score: number;
  rank?: number;
  started_at?: string;
  finished_at?: string;
  created_at: string;
}

export interface ContestSubmission {
  id: string;
  contest_id: string;
  problem_id: string;
  user_id: string;
  code?: string;
  language?: string;
  answer?: string;
  score: number;
  max_score: number;
  status: SubmissionStatus;
  execution_time?: number;
  memory_used?: number;
  output?: string;
  created_at: string;
}

export interface CreateContestDTO {
  title: string;
  description?: string;
  type: ContestType;
  start_time: string;
  end_time: string;
  duration?: number;
  max_participants?: number;
  is_public?: boolean;
}

export interface CreateProblemDTO {
  title: string;
  description: string;
  type: ProblemType;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  time_limit?: number;
  memory_limit?: number;
  input_format?: string;
  output_format?: string;
  sample_input?: string;
  sample_output?: string;
  test_cases?: unknown;
  options?: Record<string, string>;
  correct_answer?: string;
}

export interface SubmitAnswerDTO {
  code?: string;
  language?: string;
  answer?: string;
}

export interface ContestLeaderboard {
  participants: ContestParticipant[];
  total_count: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const contestService = {
  // Contest CRUD
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    api
      .get<R<{ contests: Contest[]; total_count: number }>>("/contests", { params })
      .then((r) => r.data.data),

  getBySlug: (slug: string) =>
    api.get<R<Contest>>(`/contests/${slug}`).then((r) => r.data.data),

  create: (data: CreateContestDTO) =>
    api.post<R<Contest>>("/contests", data).then((r) => r.data.data),

  update: (id: string, data: Partial<CreateContestDTO>) =>
    api.put<R<Contest>>(`/contests/${id}`, data).then((r) => r.data.data),

  delete: (id: string) => api.delete(`/contests/${id}`).then((r) => r.data),

  publish: (id: string) =>
    api.post<R<Contest>>(`/contests/${id}/publish`).then((r) => r.data.data),

  // Problems
  getProblems: (contestId: string) =>
    api
      .get<R<ContestProblem[]>>(`/contests/${contestId}/problems`)
      .then((r) => r.data.data),

  createProblem: (contestId: string, data: CreateProblemDTO) =>
    api
      .post<R<ContestProblem>>(`/contests/${contestId}/problems`, data)
      .then((r) => r.data.data),

  updateProblem: (contestId: string, problemId: string, data: Partial<CreateProblemDTO>) =>
    api
      .put<R<ContestProblem>>(`/contests/${contestId}/problems/${problemId}`, data)
      .then((r) => r.data.data),

  deleteProblem: (contestId: string, problemId: string) =>
    api.delete(`/contests/${contestId}/problems/${problemId}`).then((r) => r.data),

  // Participation
  join: (contestId: string) =>
    api
      .post<R<ContestParticipant>>(`/contests/${contestId}/join`)
      .then((r) => r.data.data),

  getLeaderboard: (contestId: string, params?: { page?: number; limit?: number }) =>
    api
      .get<R<ContestLeaderboard>>(`/contests/${contestId}/leaderboard`, { params })
      .then((r) => r.data.data),

  // Submissions
  submit: (contestId: string, problemId: string, data: SubmitAnswerDTO) =>
    api
      .post<R<ContestSubmission>>(`/contests/${contestId}/problems/${problemId}/submit`, data)
      .then((r) => r.data.data),

  getMySubmissions: (contestId: string) =>
    api
      .get<R<ContestSubmission[]>>(`/contests/${contestId}/submissions/me`)
      .then((r) => r.data.data),

  // My contests
  getMyContests: () =>
    api.get<R<Contest[]>>("/contests/me").then((r) => r.data.data),
};
