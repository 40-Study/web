/**
 * React Query hooks for whiteboard operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { whiteboardService } from "@/services/whiteboard.service";
import type { SaveSnapshotDTO, WhiteboardEventDTO } from "@/services/whiteboard.service";

export const whiteboardKeys = {
  all: ["whiteboard"] as const,
  snapshot: (sessionId: string) => [...whiteboardKeys.all, "snapshot", sessionId] as const,
};

/** Fetch the whiteboard snapshot for a session */
export function useWhiteboardSnapshot(sessionId: string) {
  return useQuery({
    queryKey: whiteboardKeys.snapshot(sessionId),
    queryFn: () => whiteboardService.getSnapshot(sessionId),
    enabled: !!sessionId,
  });
}

/** Save a whiteboard snapshot */
export function useSaveWhiteboardSnapshot(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveSnapshotDTO) => whiteboardService.saveSnapshot(sessionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: whiteboardKeys.snapshot(sessionId) });
    },
    onError: () => toast.error("Không thể lưu bảng vẽ"),
  });
}

/** Send a whiteboard event */
export function useSendWhiteboardEvent(sessionId: string) {
  return useMutation({
    mutationFn: (data: WhiteboardEventDTO) => whiteboardService.sendEvent(sessionId, data),
    onError: () => toast.error("Không thể gửi sự kiện bảng vẽ"),
  });
}
