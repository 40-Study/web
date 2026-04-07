/**
 * React Query hooks for parent notifications
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  parentNotificationService,
  type SendReminderDTO,
  type BulkAssignmentReminderDTO,
  type NotificationType,
} from "@/services/parent-notification.service";

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const parentNotificationKeys = {
  all: ["parent-notifications"] as const,
  history: (params?: { student_id?: string; type?: NotificationType }) =>
    [...parentNotificationKeys.all, "history", params] as const,
  stats: () => [...parentNotificationKeys.all, "stats"] as const,
};

// ─── Queries ────────────────────────────────────────────────────────────────

export function useParentNotificationHistory(params?: {
  student_id?: string;
  type?: NotificationType;
  page?: number;
}) {
  return useQuery({
    queryKey: parentNotificationKeys.history(params),
    queryFn: () => parentNotificationService.getHistory(params),
  });
}

export function useParentNotificationStats() {
  return useQuery({
    queryKey: parentNotificationKeys.stats(),
    queryFn: () => parentNotificationService.getStats(),
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useSendParentNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SendReminderDTO) => parentNotificationService.send(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: parentNotificationKeys.all });
      toast.success(`Đã gửi thông báo đến ${data.sent_count} phụ huynh`);
      if (data.failed_count > 0) {
        toast.warning(`${data.failed_count} thông báo gửi thất bại`);
      }
    },
    onError: (error: Error) => {
      toast.error("Không thể gửi thông báo", { description: error.message });
    },
  });
}

export function useSendAssignmentReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: BulkAssignmentReminderDTO) =>
      parentNotificationService.sendAssignmentReminder(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: parentNotificationKeys.all });
      toast.success(`Đã gửi nhắc nhở đến ${data.sent_count} phụ huynh`);
      if (data.failed_count > 0) {
        toast.warning(`${data.failed_count} thông báo gửi thất bại`);
      }
    },
    onError: (error: Error) => {
      toast.error("Không thể gửi nhắc nhở", { description: error.message });
    },
  });
}

export function useSendLiveSessionReminderToParents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, studentIds }: { sessionId: string; studentIds?: string[] }) =>
      parentNotificationService.sendLiveSessionReminder(sessionId, studentIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: parentNotificationKeys.all });
      toast.success(`Đã gửi nhắc nhở đến ${data.sent_count} phụ huynh`);
    },
    onError: (error: Error) => {
      toast.error("Không thể gửi nhắc nhở", { description: error.message });
    },
  });
}
