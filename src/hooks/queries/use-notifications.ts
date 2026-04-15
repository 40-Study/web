/**
 * React Query hooks for notifications — list, unread count, mark read, delete
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";
import { useAuthStore } from "@/stores/auth.store";

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (page?: number) => [...notificationKeys.all, "list", page] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/** List notifications, paginated — only fetches when authenticated */
export function useNotifications(page?: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: notificationKeys.list(page),
    queryFn: () => notificationService.list({ page: page ?? 1, page_size: 20 }),
    enabled: isAuthenticated,
  });
}

/** Unread count — polls every 60s as fallback, WebSocket handles real-time updates */
export function useUnreadCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 60_000, // Fallback polling, WebSocket provides real-time
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Mark a single notification as read */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/** Mark all notifications as read */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/** Delete a notification */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
