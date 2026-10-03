/**
 * React Query hooks for coding assignments
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-messages";
import {
  assignmentService,
  type CreateAssignmentDTO,
  type UpdateAssignmentDTO,
} from "@/services/assignment.service";

export const assignmentKeys = {
  all: ["assignments"] as const,
  bySession: (sessionId: string) => [...assignmentKeys.all, "session", sessionId] as const,
  byClass: (classId: string) => [...assignmentKeys.all, "class", classId] as const,
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

/** Danh sách bài tập của một lớp (quyền xem do backend quyết định: 404 khi không xem được lớp) */
export function useAssignmentsByClass(classId: string) {
  return useQuery({
    queryKey: assignmentKeys.byClass(classId),
    queryFn: () => assignmentService.getByClass(classId),
    enabled: !!classId,
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
    onError: (error) => toast.error(getErrorMessage(error, "Không thể tạo bài tập")),
  });
}

/**
 * Update an existing assignment.
 * Các thao tác ghi (tạo/sửa/xóa/công bố) chỉ dành cho giảng viên chủ khoá (hoặc admin): backend trả 403
 * khi bạn thấy bài tập nhưng không phải chủ, 404 khi không xem được. getErrorMessage đổi cả hai sang
 * câu tiếng Việt rõ ràng thay vì câu chung "Không thể ...".
 */
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
    onError: (error) => toast.error(getErrorMessage(error, "Không thể cập nhật bài tập")),
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
    onError: (error) => toast.error(getErrorMessage(error, "Không thể xóa bài tập")),
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
    onError: (error) => toast.error(getErrorMessage(error, "Không thể công bố bài tập")),
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
    onError: (error) => toast.error(getErrorMessage(error, "Không thể hủy công bố bài tập")),
  });
}
