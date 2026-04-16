import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { personalEventService, type CreatePersonalEventDTO } from "@/services/personal-event.service";

export const personalEventKeys = {
  all: ["personal-events"] as const,
  range: (start: string, end: string) => [...personalEventKeys.all, start, end] as const,
};

export function usePersonalEvents(start: string, end: string) {
  return useQuery({
    queryKey: personalEventKeys.range(start, end),
    queryFn: () => personalEventService.list(start, end),
    enabled: !!start && !!end,
  });
}

export function useCreatePersonalEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePersonalEventDTO) => personalEventService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: personalEventKeys.all });
      toast.success("Đã thêm sự kiện");
    },
    onError: () => toast.error("Không thể thêm sự kiện"),
  });
}

export function useUpdatePersonalEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePersonalEventDTO> }) =>
      personalEventService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: personalEventKeys.all });
      toast.success("Đã cập nhật sự kiện");
    },
    onError: () => toast.error("Không thể cập nhật"),
  });
}

export function useDeletePersonalEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => personalEventService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: personalEventKeys.all });
      toast.success("Đã xóa sự kiện");
    },
    onError: () => toast.error("Không thể xóa"),
  });
}
