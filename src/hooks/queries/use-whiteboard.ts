/**
 * React Query hooks for whiteboard operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { whiteboardService } from "@/services/whiteboard.service";
import type { CreateWhiteboardDTO, UpdateWhiteboardDTO, WhiteboardElement } from "@/types/whiteboard";

export const whiteboardKeys = {
  all: ["whiteboard"] as const,
  detail: (roomId: string) => [...whiteboardKeys.all, "detail", roomId] as const,
  elements: (id: string) => [...whiteboardKeys.all, "elements", id] as const,
};

export function useWhiteboard(roomId: string) {
  return useQuery({
    queryKey: whiteboardKeys.detail(roomId),
    queryFn: () => whiteboardService.getWhiteboard(roomId),
    enabled: !!roomId,
  });
}

export function useWhiteboardElements(id: string) {
  return useQuery({
    queryKey: whiteboardKeys.elements(id),
    queryFn: () => whiteboardService.getElements(id),
    enabled: !!id,
  });
}

export function useCreateWhiteboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWhiteboardDTO) => whiteboardService.createWhiteboard(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: whiteboardKeys.all });
      toast.success("Tạo bảng vẽ thành công");
    },
    onError: () => toast.error("Không thể tạo bảng vẽ"),
  });
}

export function useUpdateWhiteboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWhiteboardDTO }) =>
      whiteboardService.updateWhiteboard(id, data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: whiteboardKeys.detail(result.room_id) });
    },
    onError: () => toast.error("Không thể lưu bảng vẽ"),
  });
}

export function useAddWhiteboardElement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, element }: { id: string; element: Omit<WhiteboardElement, "id"> }) =>
      whiteboardService.addElement(id, element),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: whiteboardKeys.elements(id) });
    },
    onError: () => toast.error("Không thể thêm phần tử"),
  });
}
