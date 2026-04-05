/**
 * React Query hooks for user public profile and stats
 */

import { useQuery } from "@tanstack/react-query";
import { userStatsService } from "@/services/user-stats.service";

export const userStatsKeys = {
  all: ["user-stats"] as const,
  publicProfile: (userId: string) => [...userStatsKeys.all, "profile", userId] as const,
};

/** Public profile and stats for any user */
export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: userStatsKeys.publicProfile(userId),
    queryFn: () => userStatsService.getPublicProfile(userId),
    enabled: !!userId,
  });
}
