/**
 * Quiz service — quizzes, questions, and attempts
 * Endpoints: /quizzes, /lessons/:lessonId/quizzes, /sessions/:sessionId/quizzes
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type TriggerType = "manual" | "scheduled" | "video_checkpoint" | "ai_triggered";
export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "short_answer";

export interface Quiz {
  id: string;
  lesson_id?: string;
  session_id?: string;
  title: string;
  description?: string;
  time_limit_minutes?: number;
  pass_percentage?: number;
  trigger_type: TriggerType;
  shuffle_questions?: boolean;
  shuffle_answers?: boolean;
  show_correct_answers?: boolean;
  scheduled_at?: string;
  video_timestamp?: number;
  max_attempts?: number | null;
  is_ai_generated?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface QuizAnswer {
  answer_text: string;
  is_correct: boolean;
  display_order: number;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  explanation?: string;
  points: number;
  display_order: number;
  answers: QuizAnswer[];
  created_at?: string;
}

export interface CreateQuizDTO {
  lesson_id?: string;
  session_id?: string;
  title: string;
  description?: string;
  time_limit_minutes?: number;
  pass_percentage?: number;
  trigger_type: TriggerType;
  shuffle_questions?: boolean;
  shuffle_answers?: boolean;
  show_correct_answers?: boolean;
  scheduled_at?: string;
  video_timestamp?: number;
  max_attempts?: number | null;
  is_ai_generated?: boolean;
}

export interface UpdateQuizDTO {
  title?: string;
  description?: string;
  time_limit_minutes?: number;
  pass_percentage?: number;
}

export interface CreateQuestionDTO {
  question_text: string;
  question_type: QuestionType;
  explanation?: string;
  points: number;
  display_order: number;
  answers: QuizAnswer[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score?: number;
  total_points?: number;
  percentage?: number;
  is_passed?: boolean;
  time_spent_seconds?: number;
  started_at: string;
  completed_at?: string;
}

export interface StartQuizResponse {
  attempt_id: string;
  quiz_id: string;
  title: string;
  time_limit_minutes?: number;
  questions: AttemptQuestion[];
  started_at: string;
}

export interface AttemptQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  points: number;
  display_order: number;
  image_url?: string;
  answers: AttemptAnswer[];
}

export interface AttemptAnswer {
  id: string;
  answer_text: string;
  display_order: number;
}

export interface SubmitQuizDTO {
  answers: Array<{
    question_id: string;
    selected_answer_ids?: string[];
    text_answer?: string;
  }>;
}

export interface SaveAnswerDTO {
  question_id: string;
  selected_answer_ids?: string[];
  text_answer?: string;
}

export interface QuizAttemptDetail extends QuizAttempt {
  answers: Array<{
    id: string;
    question_id: string;
    question_text: string;
    selected_answer_ids: string[];
    text_answer?: string;
    is_correct?: boolean;
    points_earned: number;
    correct_answer_ids?: string[];
    explanation?: string;
  }>;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const quizService = {
  // ── Quiz CRUD ─────────────────────────────────────────────────────────────

  /** POST /quizzes */
  create: (data: CreateQuizDTO) =>
    api.post<R<Quiz>>("/quizzes", data).then((r) => r.data.data),

  /** GET /quizzes/:quizId */
  getById: (quizId: string) =>
    api.get<R<Quiz>>(`/quizzes/${quizId}`).then((r) => r.data.data),

  /** GET /lessons/:lessonId/quizzes */
  getByLesson: (lessonId: string) =>
    api.get<R<Quiz[]>>(`/lessons/${lessonId}/quizzes`).then((r) => r.data.data),

  /** GET /sessions/:sessionId/quizzes */
  getBySession: (sessionId: string) =>
    api.get<R<Quiz[]>>(`/sessions/${sessionId}/quizzes`).then((r) => r.data.data),

  /** PUT /quizzes/:quizId */
  update: (quizId: string, data: UpdateQuizDTO) =>
    api.put<R<Quiz>>(`/quizzes/${quizId}`, data).then((r) => r.data.data),

  /** DELETE /quizzes/:quizId */
  delete: (quizId: string) =>
    api.delete<R<null>>(`/quizzes/${quizId}`).then((r) => r.data),

  /** POST /quizzes/:quizId/trigger — trigger a quiz in live session */
  trigger: (quizId: string, sessionId: string) =>
    api.post<R<null>>(`/quizzes/${quizId}/trigger`, { session_id: sessionId }).then((r) => r.data),

  // ── Questions ─────────────────────────────────────────────────────────────

  /** POST /quizzes/:quizId/questions */
  createQuestion: (quizId: string, data: CreateQuestionDTO) =>
    api
      .post<R<QuizQuestion>>(`/quizzes/${quizId}/questions`, data)
      .then((r) => r.data.data),

  /** GET /quizzes/:quizId/questions */
  getQuestions: (quizId: string) =>
    api
      .get<R<QuizQuestion[]>>(`/quizzes/${quizId}/questions`)
      .then((r) => r.data.data),

  /** DELETE /quizzes/:quizId/questions/:questionId */
  deleteQuestion: (quizId: string, questionId: string) =>
    api
      .delete<R<null>>(`/quizzes/${quizId}/questions/${questionId}`)
      .then((r) => r.data),

  // ── Attempts ──────────────────────────────────────────────────────────────

  /** POST /quizzes/:quizId/start — start a quiz attempt */
  startQuiz: (quizId: string) =>
    api
      .post<R<StartQuizResponse>>(`/quizzes/${quizId}/start`, {})
      .then((r) => r.data.data),

  /** POST /quizzes/:quizId/submit — submit quiz answers */
  submitQuiz: (quizId: string, data: SubmitQuizDTO) =>
    api
      .post<R<QuizAttempt>>(`/quizzes/${quizId}/submit`, data)
      .then((r) => r.data.data),

  /** POST /attempts/:attemptId/save-answer — save answer in progress */
  saveAnswer: (attemptId: string, data: SaveAnswerDTO) =>
    api
      .post<R<null>>(`/attempts/${attemptId}/save-answer`, data)
      .then((r) => r.data),

  /** GET /attempts/:attemptId/progress — get attempt progress */
  getAttemptProgress: (attemptId: string) =>
    api
      .get<R<{ answers: Record<string, string[]> }>>(`/attempts/${attemptId}/progress`)
      .then((r) => r.data.data),

  /** GET /quizzes/:quizId/attempts — get my attempts */
  getMyAttempts: (quizId: string) =>
    api
      .get<R<QuizAttempt[]>>(`/quizzes/${quizId}/attempts`)
      .then((r) => r.data.data),

  /** GET /quizzes/:quizId/attempts/:attemptId — get attempt detail */
  getAttemptDetail: (quizId: string, attemptId: string) =>
    api
      .get<R<QuizAttemptDetail>>(`/quizzes/${quizId}/attempts/${attemptId}`)
      .then((r) => r.data.data),

  /** GET /quizzes/:quizId/results — get quiz results (teacher) */
  getQuizResults: (quizId: string) =>
    api
      .get<R<{ quiz_id: string; title: string; total_students: number; attempts: QuizAttempt[] }>>(`/quizzes/${quizId}/results`)
      .then((r) => r.data.data),
};
