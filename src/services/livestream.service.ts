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
    api.get<{ message: string; data: { sessions: LivestreamSession[] } }>("/livestream", { params: classId ? { class_id: classId } : {} })
      .then((r) => r.data.data.sessions),

  getSession: (id: string) =>
    api.get<{ message: string; data: LivestreamSession }>(`/livestream/${id}`)
      .then((r) => r.data.data),

  createSession: (data: CreateSessionDTO) =>
    api.post<{ message: string; data: LivestreamSession }>("/livestream", data)
      .then((r) => r.data.data),

  startSession: (id: string) =>
    api.post<{ message: string; data: LivestreamSession }>(`/livestream/${id}/start`, {})
      .then((r) => r.data.data),

  endSession: (id: string) =>
    api.post<{ message: string; data: LivestreamSession }>(`/livestream/${id}/end`, {})
      .then((r) => r.data.data),

  // Room token
  getRoomToken: (roomName: string) =>
    api.post<{ message: string; data: { token: string } }>(`/live/rooms/${roomName}/token`, {})
      .then((r) => r.data.data),

  // Participants
  getParticipants: (sessionId: string) =>
    api.get<{ message: string; data: { participants: Participant[] } }>(`/livestream/${sessionId}/participants`)
      .then((r) => r.data.data.participants),

  muteParticipant: (sessionId: string, participantId: string) =>
    api.post<{ message: string }>(`/livestream/${sessionId}/mute`, { participant_id: participantId })
      .then((r) => r.data),

  kickParticipant: (sessionId: string, participantId: string) =>
    api.post<{ message: string }>(`/livestream/${sessionId}/kick`, { participant_id: participantId })
      .then((r) => r.data),

  // Chat
  getMessages: (sessionId: string, limit?: number) =>
    api.get<{ message: string; data: { messages: ChatMessage[] } }>(
      `/chat/${sessionId}/messages`, { params: limit ? { limit } : {} }
    ).then((r) => r.data.data.messages),

  sendMessage: (sessionId: string, content: string) =>
    api.post<{ message: string; data: ChatMessage }>(`/chat/${sessionId}/send`, { content })
      .then((r) => r.data.data),

  pinMessage: (sessionId: string, messageId: string) =>
    api.post<{ message: string }>(`/chat/${sessionId}/messages/${messageId}/pin`, {}).then((r) => r.data),

  deleteMessage: (sessionId: string, messageId: string) =>
    api.delete<{ message: string }>(`/chat/${sessionId}/messages/${messageId}`).then((r) => r.data),

  // Assignments - Note: Backend doesn't have /sessions/:sessionId route, using handler's GetBySession
  getAssignments: (sessionId: string) =>
    api.get<{ message: string; data: { assignments: Assignment[] } }>("/assignments", { params: { session_id: sessionId } })
      .then((r) => r.data.data.assignments),

  createAssignment: (sessionId: string, data: CreateAssignmentDTO) =>
    api.post<{ message: string; data: Assignment }>("/assignments", { ...data, session_id: sessionId })
      .then((r) => r.data.data),

  publishAssignment: (assignmentId: string) =>
    api.post<{ message: string }>(`/assignments/${assignmentId}/publish`, {}).then((r) => r.data),

  // Submissions
  submitCode: (assignmentId: string, code: string, language: string) =>
    api.post<{ message: string; data: Submission }>("/submissions", { assignment_id: assignmentId, code, language })
      .then((r) => r.data.data),

  runCode: (code: string, language: string, input?: string) =>
    api.post<{ message: string; data: { output: string; error?: string; execution_time: number } }>(
      "/submissions/run", { code, language, input }
    ).then((r) => r.data.data),

  getSubmission: (id: string) =>
    api.get<{ message: string; data: Submission }>(`/submissions/${id}`).then((r) => r.data.data),

  getSubmissions: (assignmentId: string) =>
    api.get<{ message: string; data: { submissions: Submission[] } }>(
      "/submissions", { params: { assignment_id: assignmentId } }
    ).then((r) => r.data.data.submissions),

  // Whiteboard
  getWhiteboard: (sessionId: string) =>
    api.get<{ message: string; data: { elements: unknown[]; version: number } }>(`/whiteboard/${sessionId}/snapshot`)
      .then((r) => r.data.data),

  saveWhiteboard: (sessionId: string, elements: unknown[]) =>
    api.post<{ message: string }>(`/whiteboard/${sessionId}/snapshot`, { elements }).then((r) => r.data),
};
