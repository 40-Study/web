/**
 * React Query hooks for livestream classroom
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { livestreamService } from "@/services/livestream.service";

export const livestreamKeys = {
  all: ["livestream"] as const,
  sessions: (classId?: string) => [...livestreamKeys.all, "sessions", classId] as const,
  session: (id: string) => [...livestreamKeys.all, "session", id] as const,
  participants: (id: string) => [...livestreamKeys.all, "participants", id] as const,
  messages: (id: string) => [...livestreamKeys.all, "messages", id] as const,
  assignments: (id: string) => [...livestreamKeys.all, "assignments", id] as const,
  submissions: (assignmentId: string) => [...livestreamKeys.all, "submissions", assignmentId] as const,
  submission: (id: string) => [...livestreamKeys.all, "submission", id] as const,
};

export function useSessions(classId?: string) {
  return useQuery({
    queryKey: livestreamKeys.sessions(classId),
    queryFn: () => livestreamService.listSessions(classId),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: livestreamKeys.session(id),
    queryFn: () => livestreamService.getSession(id),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: livestreamService.createSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: livestreamKeys.sessions() });
      toast.success("Tạo phiên học thành công");
    },
  });
}

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: livestreamService.startSession,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: livestreamKeys.session(id) });
    },
  });
}

export function useEndSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: livestreamService.endSession,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: livestreamKeys.session(id) });
      toast.success("Kết thúc phiên học");
    },
  });
}

export function useRoomToken(roomName: string) {
  return useQuery({
    queryKey: ["room-token", roomName],
    queryFn: () => livestreamService.getRoomToken(roomName),
    enabled: !!roomName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useParticipants(sessionId: string) {
  return useQuery({
    queryKey: livestreamKeys.participants(sessionId),
    queryFn: () => livestreamService.getParticipants(sessionId),
    enabled: !!sessionId,
    refetchInterval: 10000, // Poll every 10s
  });
}

export function useMessages(sessionId: string) {
  return useQuery({
    queryKey: livestreamKeys.messages(sessionId),
    queryFn: () => livestreamService.getMessages(sessionId, 100),
    enabled: !!sessionId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
      livestreamService.sendMessage(sessionId, content),
    onSuccess: (_, { sessionId }) => {
      qc.invalidateQueries({ queryKey: livestreamKeys.messages(sessionId) });
    },
  });
}

export function useAssignments(sessionId: string) {
  return useQuery({
    queryKey: livestreamKeys.assignments(sessionId),
    queryFn: () => livestreamService.getAssignments(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: Parameters<typeof livestreamService.createAssignment>[1] }) =>
      livestreamService.createAssignment(sessionId, data),
    onSuccess: (_, { sessionId }) => {
      qc.invalidateQueries({ queryKey: livestreamKeys.assignments(sessionId) });
      toast.success("Tạo bài tập thành công");
    },
  });
}

export function useSubmitCode() {
  return useMutation({
    mutationFn: ({ assignmentId, code, language }: { assignmentId: string; code: string; language: string }) =>
      livestreamService.submitCode(assignmentId, code, language),
    onSuccess: () => {
      toast.success("Nộp bài thành công");
    },
  });
}

export function useRunCode() {
  return useMutation({
    mutationFn: ({ code, language, input }: { code: string; language: string; input?: string }) =>
      livestreamService.runCode(code, language, input),
  });
}

export function useSubmission(id: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: livestreamKeys.submission(id),
    queryFn: () => livestreamService.getSubmission(id),
    enabled: enabled && !!id,
    refetchInterval: (query) => {
      // Poll while pending
      if (query.state.data?.verdict === "pending") return 2000;
      return false;
    },
  });
}
