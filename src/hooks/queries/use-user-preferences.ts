/**
 * React Query hooks for user privacy preferences (GET/PUT /preferences/privacy)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userPreferenceService } from "@/services/user-preference.service";

const QUERY_KEY = ["privacy-settings"] as const;

export function usePrivacySettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: userPreferenceService.getPrivacySettings,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdatePrivacySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, string>) => userPreferenceService.updatePrivacySettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: () => {
      toast.error("Không thể lưu cài đặt quyền riêng tư");
    },
  });
}
