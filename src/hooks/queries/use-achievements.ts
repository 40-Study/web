/**
 * React Query hooks for achievements
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { achievementService } from "@/services/achievement.service";

export const achievementKeys = {
  all: ["achievements"] as const,
  mine: () => [...achievementKeys.all, "mine"] as const,
  detail: (id: string) => [...achievementKeys.all, "detail", id] as const,
};

/** All achievements in the system */
export function useAchievements() {
  return useQuery({
    queryKey: achievementKeys.all,
    queryFn: () => achievementService.getAll(),
  });
}

/** Current user's achievements with unlock status and progress */
export function useMyAchievements() {
  return useQuery({
    queryKey: achievementKeys.mine(),
    queryFn: () => achievementService.getMyAchievements(),
  });
}

/** Unlock an achievement by ID */
export function useUnlockAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => achievementService.unlock(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: achievementKeys.mine() });
      toast.success("Thành tích đã được mở khóa!");
    },
    onError: () => toast.error("Không thể mở khóa thành tích"),
  });
}
