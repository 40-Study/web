/**
 * React Query hooks for notification preferences (GET/PUT /notifications/settings)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationService } from "@/services/notification.service";

const QUERY_KEY = ["notification-settings"] as const;

export function useNotificationSettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: notificationService.getSettings,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, boolean>) => notificationService.updateSettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: () => {
      toast.error("Không thể lưu cài đặt thông báo");
    },
  });
}
