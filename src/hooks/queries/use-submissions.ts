/**
 * React Query hooks for code submissions and execution
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  submissionService,
  type SubmitCodeDTO,
  type RunCodeDTO,
  type RunCustomInputDTO,
  type ExecuteCodeDTO,
} from "@/services/submission.service";

export const submissionKeys = {
  all: ["submissions"] as const,
  detail: (id: string) => [...submissionKeys.all, "detail", id] as const,
  byAssignment: (assignmentId: string) =>
    [...submissionKeys.all, "assignment", assignmentId] as const,
  mine: (assignmentId: string) =>
    [...submissionKeys.all, "mine", assignmentId] as const,
};

/** Get a single submission by ID */
export function useSubmission(id: string) {
  return useQuery({
    queryKey: submissionKeys.detail(id),
    queryFn: () => submissionService.getById(id),
    enabled: !!id,
  });
}

/** All submissions for an assignment (teacher/admin view) */
export function useSubmissionsByAssignment(assignmentId: string) {
  return useQuery({
    queryKey: submissionKeys.byAssignment(assignmentId),
    queryFn: () => submissionService.getByAssignment(assignmentId),
    enabled: !!assignmentId,
  });
}

/** Current user's submissions for an assignment */
export function useMySubmissions(assignmentId: string) {
  return useQuery({
    queryKey: submissionKeys.mine(assignmentId),
    queryFn: () => submissionService.getMySubmissions(assignmentId),
    enabled: !!assignmentId,
  });
}

/** Submit code for grading */
export function useSubmitCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SubmitCodeDTO) => submissionService.submit(dto),
    onSuccess: (_, dto) => {
      qc.invalidateQueries({ queryKey: submissionKeys.mine(dto.assignment_id) });
      qc.invalidateQueries({ queryKey: submissionKeys.byAssignment(dto.assignment_id) });
      toast.success("Đã nộp bài");
    },
    onError: () => toast.error("Không thể nộp bài"),
  });
}

/** Run code against assignment test cases (no grading) */
export function useRunCode() {
  return useMutation({
    mutationFn: (dto: RunCodeDTO) => submissionService.run(dto),
    onError: () => toast.error("Không thể chạy code"),
  });
}

/** Run code with custom input */
export function useRunCustomInput() {
  return useMutation({
    mutationFn: (dto: RunCustomInputDTO) => submissionService.runCustom(dto),
    onError: () => toast.error("Không thể chạy code"),
  });
}

/** Free sandbox execution — no assignment required */
export function useExecuteCode() {
  return useMutation({
    mutationFn: (dto: ExecuteCodeDTO) => submissionService.execute(dto),
    onError: () => toast.error("Không thể thực thi code"),
  });
}
