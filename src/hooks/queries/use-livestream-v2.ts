/**
 * React Query hooks for livestream CRUD operations
 * Uses the new /livestreams REST endpoints
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  livestreamService,
  type CreateLivestreamDTO,
  type UpdateLivestreamDTO,
} from "@/services/livestream.service";

export const livestreamV2Keys = {
  all: ["livestreams"] as const,
  list: () => [...livestreamV2Keys.all, "list"] as const,
  detail: (id: string) => [...livestreamV2Keys.all, "detail", id] as const,
};

export function useLivestreams() {
  return useQuery({
    queryKey: livestreamV2Keys.list(),
    queryFn: () => livestreamService.getAll(),
  });
}

export function useLivestream(id: string) {
  return useQuery({
    queryKey: livestreamV2Keys.detail(id),
    queryFn: () => livestreamService.getById(id),
    enabled: !!id,
  });
}

export function useCreateLivestream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLivestreamDTO) => livestreamService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: livestreamV2Keys.all });
      toast.success("Tạo livestream thành công");
    },
    onError: () => toast.error("Không thể tạo livestream"),
  });
}

export function useUpdateLivestream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLivestreamDTO }) =>
      livestreamService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: livestreamV2Keys.detail(id) });
      toast.success("Cập nhật thành công");
    },
    onError: () => toast.error("Không thể cập nhật"),
  });
}

export function useDeleteLivestream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => livestreamService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: livestreamV2Keys.all });
      toast.success("Đã xóa livestream");
    },
    onError: () => toast.error("Không thể xóa livestream"),
  });
}

export function useStartLivestream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roomName }: { id: string; roomName: string }) =>
      livestreamService.start(id, roomName),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: livestreamV2Keys.detail(id) });
      toast.success("Đã bắt đầu livestream");
    },
    onError: () => toast.error("Không thể bắt đầu livestream"),
  });
}

export function useStopLivestream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => livestreamService.end(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: livestreamV2Keys.detail(id) });
      toast.success("Đã kết thúc livestream");
    },
    onError: () => toast.error("Không thể kết thúc livestream"),
  });
}
