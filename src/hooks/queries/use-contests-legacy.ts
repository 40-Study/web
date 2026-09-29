/**
 * LEGACY — xem đầu `services/contest-legacy.service.ts`. Chỉ trang giảng viên cũ (lane W2) dùng;
 * xoá khi W2 merge. KHÔNG dùng cho màn hình mới.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  legacyContestService,
  type CreateContestDTO,
  type CreateProblemDTO,
} from "@/services/contest-legacy.service";

const legacyKeys = {
  all: ["contests-legacy"] as const,
  list: (params?: object) => [...legacyKeys.all, "list", params] as const,
};

export function useContests(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: legacyKeys.list(params),
    queryFn: () => legacyContestService.list(params),
  });
}

export function useCreateContest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContestDTO) => legacyContestService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: legacyKeys.all });
      toast.success("Tạo cuộc thi thành công");
    },
    onError: () => toast.error("Không thể tạo cuộc thi"),
  });
}

export function useDeleteContest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => legacyContestService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: legacyKeys.all });
      toast.success("Xoá cuộc thi thành công");
    },
    onError: () => toast.error("Không thể xoá cuộc thi"),
  });
}

export function usePublishContest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => legacyContestService.publish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: legacyKeys.all });
      toast.success("Cuộc thi đã được công bố");
    },
    onError: () => toast.error("Không thể công bố cuộc thi"),
  });
}

export function useCreateProblem(contestId: string) {
  return useMutation({
    mutationFn: (data: CreateProblemDTO) => legacyContestService.createProblem(contestId, data),
    onSuccess: () => toast.success("Thêm bài thi thành công"),
    onError: () => toast.error("Không thể thêm bài thi"),
  });
}
