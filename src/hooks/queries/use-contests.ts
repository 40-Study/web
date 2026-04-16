import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  contestService,
  type CreateContestDTO,
  type CreateProblemDTO,
  type SubmitAnswerDTO,
} from "@/services/contest.service";

export const contestKeys = {
  all: ["contests"] as const,
  list: (params?: { status?: string }) => [...contestKeys.all, "list", params] as const,
  detail: (slug: string) => [...contestKeys.all, "detail", slug] as const,
  problems: (contestId: string) => [...contestKeys.all, "problems", contestId] as const,
  leaderboard: (contestId: string) => [...contestKeys.all, "leaderboard", contestId] as const,
  mySubmissions: (contestId: string) => [...contestKeys.all, "my-submissions", contestId] as const,
  myContests: () => [...contestKeys.all, "mine"] as const,
};

export function useContests(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: contestKeys.list(params),
    queryFn: () => contestService.list(params),
  });
}

export function useContest(slug: string) {
  return useQuery({
    queryKey: contestKeys.detail(slug),
    queryFn: () => contestService.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useContestProblems(contestId: string) {
  return useQuery({
    queryKey: contestKeys.problems(contestId),
    queryFn: () => contestService.getProblems(contestId),
    enabled: !!contestId,
  });
}

export function useContestLeaderboard(contestId: string) {
  return useQuery({
    queryKey: contestKeys.leaderboard(contestId),
    queryFn: () => contestService.getLeaderboard(contestId),
    enabled: !!contestId,
    refetchInterval: 30000,
  });
}

export function useMyContestSubmissions(contestId: string) {
  return useQuery({
    queryKey: contestKeys.mySubmissions(contestId),
    queryFn: () => contestService.getMySubmissions(contestId),
    enabled: !!contestId,
  });
}

export function useMyContests() {
  return useQuery({
    queryKey: contestKeys.myContests(),
    queryFn: () => contestService.getMyContests(),
  });
}

export function useCreateContest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContestDTO) => contestService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contestKeys.all });
      toast.success("Tạo cuộc thi thành công");
    },
    onError: () => toast.error("Không thể tạo cuộc thi"),
  });
}

export function useUpdateContest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateContestDTO> }) =>
      contestService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contestKeys.all });
      toast.success("Cập nhật cuộc thi thành công");
    },
    onError: () => toast.error("Không thể cập nhật cuộc thi"),
  });
}

export function useDeleteContest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contestService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contestKeys.all });
      toast.success("Xoá cuộc thi thành công");
    },
    onError: () => toast.error("Không thể xoá cuộc thi"),
  });
}

export function usePublishContest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contestService.publish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contestKeys.all });
      toast.success("Cuộc thi đã được công bố");
    },
    onError: () => toast.error("Không thể công bố cuộc thi"),
  });
}

export function useCreateProblem(contestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProblemDTO) => contestService.createProblem(contestId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contestKeys.problems(contestId) });
      toast.success("Thêm bài thi thành công");
    },
    onError: () => toast.error("Không thể thêm bài thi"),
  });
}

export function useJoinContest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contestId: string) => contestService.join(contestId),
    onSuccess: (_, contestId) => {
      qc.invalidateQueries({ queryKey: contestKeys.all });
      toast.success("Tham gia cuộc thi thành công");
    },
    onError: () => toast.error("Không thể tham gia cuộc thi"),
  });
}

export function useSubmitAnswer(contestId: string, problemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitAnswerDTO) => contestService.submit(contestId, problemId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contestKeys.mySubmissions(contestId) });
      qc.invalidateQueries({ queryKey: contestKeys.leaderboard(contestId) });
      toast.success("Nộp bài thành công");
    },
    onError: () => toast.error("Không thể nộp bài"),
  });
}
