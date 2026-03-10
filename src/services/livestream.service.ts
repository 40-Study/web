/**
 * Livestream classroom service
 */

import { api } from "@/lib/api-client";

export interface LivestreamSession {
  id: string;
  room_name: string;
  title: string;
  class_id: string;
  host_id: string;
  status: "scheduled" | "live" | "ended";
  started_at?: string;
  ended_at?: string;
  participant_count: number;
}

export interface Participant {
  id: string;
  user_id: string;
  name: string;
  avatar?: string;
  role: "host" | "co-host" | "participant";
  is_muted: boolean;
  is_video_on: boolean;
  joined_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export interface Assignment {
  id: string;
  session_id: string;
  title: string;
  description?: string;
  language: string;
  starter_code?: string;
  test_cases: TestCase[];
  time_limit?: number;
  is_published: boolean;
}

export interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
}

export interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  user_name: string;
  code: string;
  language: string;
  verdict: "pending" | "accepted" | "wrong_answer" | "time_limit" | "runtime_error" | "compile_error";
  passed_tests: number;
  total_tests: number;
  execution_time?: number;
  submitted_at: string;
}

export interface CreateSessionDTO {
  title: string;
  class_id: string;
  scheduled_at?: string;
}

export interface CreateAssignmentDTO {
  title: string;
  description?: string;
  language: string;
  starter_code?: string;
  test_cases: Omit<TestCase, "id">[];
  time_limit?: number;
}

export const livestreamService = {
  // Sessions
  listSessions: (classId?: string) =>
    api.get<{ sessions: LivestreamSession[] }>("/livestream/sessions", { params: classId ? { class_id: classId } : {} }).then((r) => r.data),

  getSession: (id: string) =>
    api.get<LivestreamSession>(`/livestream/sessions/${id}`).then((r) => r.data),

  createSession: (data: CreateSessionDTO) =>
    api.post<LivestreamSession>("/livestream/sessions", data).then((r) => r.data),

  startSession: (id: string) =>
    api.post<LivestreamSession>(`/livestream/sessions/${id}/start`, {}).then((r) => r.data),

  endSession: (id: string) =>
    api.post<LivestreamSession>(`/livestream/sessions/${id}/end`, {}).then((r) => r.data),

  // Room token
  getRoomToken: (roomName: string) =>
    api.post<{ token: string }>(`/live/rooms/${roomName}/token`, {}).then((r) => r.data),

  // Participants
  getParticipants: (sessionId: string) =>
    api.get<{ participants: Participant[] }>(`/livestream/sessions/${sessionId}/participants`).then((r) => r.data),

  muteParticipant: (sessionId: string, participantId: string) =>
    api.post<void>(`/livestream/sessions/${sessionId}/participants/${participantId}/mute`, {}).then((r) => r.data),

  kickParticipant: (sessionId: string, participantId: string) =>
    api.post<void>(`/livestream/sessions/${sessionId}/participants/${participantId}/kick`, {}).then((r) => r.data),

  // Chat
  getMessages: (sessionId: string, limit?: number) =>
    api.get<{ messages: ChatMessage[] }>(`/chat/sessions/${sessionId}/messages`, { params: limit ? { limit } : {} }).then((r) => r.data),

  sendMessage: (sessionId: string, content: string) =>
    api.post<ChatMessage>(`/chat/sessions/${sessionId}/messages`, { content }).then((r) => r.data),

  pinMessage: (sessionId: string, messageId: string) =>
    api.post<void>(`/chat/sessions/${sessionId}/messages/${messageId}/pin`, {}).then((r) => r.data),

  deleteMessage: (sessionId: string, messageId: string) =>
    api.delete<void>(`/chat/sessions/${sessionId}/messages/${messageId}`).then((r) => r.data),

  // Assignments
  getAssignments: (sessionId: string) =>
    api.get<{ assignments: Assignment[] }>(`/assignments/sessions/${sessionId}`).then((r) => r.data),

  createAssignment: (sessionId: string, data: CreateAssignmentDTO) =>
    api.post<Assignment>(`/assignments/sessions/${sessionId}`, data).then((r) => r.data),

  publishAssignment: (assignmentId: string) =>
    api.post<void>(`/assignments/${assignmentId}/publish`, {}).then((r) => r.data),

  // Submissions
  submitCode: (assignmentId: string, code: string, language: string) =>
    api.post<Submission>("/submissions", { assignment_id: assignmentId, code, language }).then((r) => r.data),

  runCode: (code: string, language: string, input?: string) =>
    api.post<{ output: string; error?: string; execution_time: number }>("/submissions/run", { code, language, input }).then((r) => r.data),

  getSubmission: (id: string) =>
    api.get<Submission>(`/submissions/${id}`).then((r) => r.data),

  getSubmissions: (assignmentId: string) =>
    api.get<{ submissions: Submission[] }>(`/submissions/assignment/${assignmentId}`).then((r) => r.data),

  // Whiteboard
  getWhiteboard: (sessionId: string) =>
    api.get<{ elements: unknown[]; version: number }>(`/whiteboard/sessions/${sessionId}`).then((r) => r.data),

  saveWhiteboard: (sessionId: string, elements: unknown[]) =>
    api.post<void>(`/whiteboard/sessions/${sessionId}`, { elements }).then((r) => r.data),
};
