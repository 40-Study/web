/**
 * React Query hooks for coding assignments
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  assignmentService,
  type CreateAssignmentDTO,
  type UpdateAssignmentDTO,
} from "@/services/assignment.service";

export const assignmentKeys = {
  all: ["assignments"] as const,
  bySession: (sessionId: string) => [...assignmentKeys.all, "session", sessionId] as const,
  detail: (id: string) => [...assignmentKeys.all, "detail", id] as const,
  sandbox: (id: string) => [...assignmentKeys.all, "sandbox", id] as const,
  testCases: (id: string) => [...assignmentKeys.all, "testcases", id] as const,
};

/** Danh sách bài tập của một buổi livestream (backend chỉ list theo session_id) */
export function useAssignmentsBySession(sessionId: string) {
  return useQuery({
    queryKey: assignmentKeys.bySession(sessionId),
    queryFn: () => assignmentService.getBySession(sessionId),
    enabled: !!sessionId,
  });
}

/** Single assignment details */
export function useAssignment(id: string) {
  return useQuery({
    queryKey: assignmentKeys.detail(id),
    queryFn: () => assignmentService.getById(id),
    enabled: !!id,
  });
}

/** Sandbox environment for an assignment */
export function useAssignmentSandbox(id: string) {
  return useQuery({
    queryKey: assignmentKeys.sandbox(id),
    queryFn: () => assignmentService.getSandbox(id),
    enabled: !!id,
  });
}

/** Test cases for an assignment */
export function useAssignmentTestCases(id: string) {
  return useQuery({
    queryKey: assignmentKeys.testCases(id),
    queryFn: () => assignmentService.getTestCases(id),
    enabled: !!id,
  });
}

/** Create a new assignment (kèm sessionId để invalidate đúng danh sách theo buổi học) */
export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dto }: { dto: CreateAssignmentDTO; sessionId: string }) =>
      assignmentService.create(dto),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: assignmentKeys.bySession(variables.sessionId) });
      qc.invalidateQueries({ queryKey: assignmentKeys.detail(data.id) });
      toast.success("Đã tạo bài tập");
    },
    onError: () => toast.error("Không thể tạo bài tập"),
  });
}

/** Update an existing assignment */
export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAssignmentDTO; sessionId: string }) =>
      assignmentService.update(id, dto),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: assignmentKeys.bySession(variables.sessionId) });
      qc.invalidateQueries({ queryKey: assignmentKeys.detail(data.id) });
      toast.success("Đã cập nhật bài tập");
    },
    onError: () => toast.error("Không thể cập nhật bài tập"),
  });
}

/** Delete an assignment */
export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; sessionId: string }) => assignmentService.delete(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: assignmentKeys.bySession(variables.sessionId) });
      toast.success("Đã xóa bài tập");
    },
    onError: () => toast.error("Không thể xóa bài tập"),
  });
}

/** Publish an assignment */
export function usePublishAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sessionId }: { id: string; sessionId: string }) =>
      assignmentService.publish(id, sessionId),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: assignmentKeys.bySession(variables.sessionId) });
      qc.invalidateQueries({ queryKey: assignmentKeys.detail(data.id) });
      toast.success("Bài tập đã được công bố");
    },
    onError: () => toast.error("Không thể công bố bài tập"),
  });
}

/** Unpublish an assignment */
export function useUnpublishAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; sessionId: string }) => assignmentService.unpublish(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: assignmentKeys.bySession(variables.sessionId) });
      toast.success("Đã hủy công bố bài tập");
    },
    onError: () => toast.error("Không thể hủy công bố bài tập"),
  });
}
