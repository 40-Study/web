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
  detail: (id: string) => [...assignmentKeys.all, "detail", id] as const,
  sandbox: (id: string) => [...assignmentKeys.all, "sandbox", id] as const,
  testCases: (id: string) => [...assignmentKeys.all, "testcases", id] as const,
};

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

/** Create a new assignment */
export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAssignmentDTO) => assignmentService.create(dto),
    onSuccess: (data) => {
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
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAssignmentDTO }) =>
      assignmentService.update(id, dto),
    onSuccess: (data) => {
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
    mutationFn: (id: string) => assignmentService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.all });
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
    onSuccess: (data) => {
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
    mutationFn: (id: string) => assignmentService.unpublish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.all });
      toast.success("Đã hủy công bố bài tập");
    },
    onError: () => toast.error("Không thể hủy công bố bài tập"),
  });
}
