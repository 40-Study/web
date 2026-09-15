/**
 * React Query hooks for live sessions (buổi học trực tiếp).
 *
 * Phase 0 fix: service bên dưới nay gọi `/livestream` (livestream_router.go).
 * Các hook gắn với endpoint KHÔNG tồn tại ở backend đã bị xoá — không còn
 * `getUpcoming` (`/live-sessions/upcoming`), `sendReminder`
 * (`/live-sessions/:id/send-reminder`), `uploadAttachments`
 * (`/live-sessions/:id/attachments`).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  liveSessionService,
  type CreateLiveSessionDTO,
  type UpdateLiveSessionDTO,
  type LiveSessionListParams,
} from "@/services/live-session.service";

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const liveSessionKeys = {
  all: ["live-sessions"] as const,
  lists: () => [...liveSessionKeys.all, "list"] as const,
  list: (params?: LiveSessionListParams) => [...liveSessionKeys.lists(), params] as const,
  details: () => [...liveSessionKeys.all, "detail"] as const,
  detail: (id: string) => [...liveSessionKeys.details(), id] as const,
};

// ─── Queries ────────────────────────────────────────────────────────────────

export function useLiveSessions(params?: LiveSessionListParams) {
  return useQuery({
    queryKey: liveSessionKeys.list(params),
    queryFn: () => liveSessionService.list(params),
  });
}

export function useLiveSession(id: string, enabled = true) {
  return useQuery({
    queryKey: liveSessionKeys.detail(id),
    queryFn: () => liveSessionService.getById(id),
    enabled: !!id && enabled,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useCreateLiveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateLiveSessionDTO) => liveSessionService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveSessionKeys.all });
      toast.success("Đã tạo buổi live thành công");
    },
    onError: (error: Error) => {
      toast.error("Không thể tạo buổi live", { description: error.message });
    },
  });
}

export function useUpdateLiveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLiveSessionDTO }) =>
      liveSessionService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: liveSessionKeys.all });
      queryClient.setQueryData(liveSessionKeys.detail(data.id), data);
      toast.success("Đã cập nhật buổi live");
    },
    onError: (error: Error) => {
      toast.error("Không thể cập nhật", { description: error.message });
    },
  });
}

export function useDeleteLiveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => liveSessionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveSessionKeys.all });
      toast.success("Đã hủy buổi live");
    },
    onError: (error: Error) => {
      toast.error("Không thể hủy", { description: error.message });
    },
  });
}

export function useStartLiveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => liveSessionService.start(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: liveSessionKeys.all });
      queryClient.setQueryData(liveSessionKeys.detail(data.id), data);
      toast.success("Buổi live đã bắt đầu!");
    },
    onError: (error: Error) => {
      toast.error("Không thể bắt đầu buổi live", { description: error.message });
    },
  });
}

export function useEndLiveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => liveSessionService.end(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: liveSessionKeys.all });
      queryClient.setQueryData(liveSessionKeys.detail(data.id), data);
      toast.success("Buổi live đã kết thúc");
    },
    onError: (error: Error) => {
      toast.error("Không thể kết thúc", { description: error.message });
    },
  });
}
