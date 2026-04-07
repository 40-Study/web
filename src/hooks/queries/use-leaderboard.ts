/**
 * React Query hooks for leaderboard rankings
 */

import { useQuery } from "@tanstack/react-query";
import { leaderboardService, type LeaderboardParams } from "@/services/leaderboard.service";
import type { PeriodType } from "@/services/leaderboard.service";

export const leaderboardKeys = {
  all: ["leaderboard"] as const,
  list: (params?: LeaderboardParams) => [...leaderboardKeys.all, "list", params] as const,
  myRank: (periodType?: PeriodType) => [...leaderboardKeys.all, "me", periodType] as const,
};

/** Global leaderboard — optionally filtered by period type */
export function useLeaderboard(params?: LeaderboardParams) {
  return useQuery({
    queryKey: leaderboardKeys.list(params),
    queryFn: () => leaderboardService.getLeaderboard(params),
  });
}

/** Current user's rank on the leaderboard */
export function useMyRank(params?: { period_type?: PeriodType } | PeriodType) {
  const periodType = typeof params === "string" ? params : params?.period_type;
  return useQuery({
    queryKey: leaderboardKeys.myRank(periodType),
    queryFn: () => leaderboardService.getMyRank(periodType ? { period_type: periodType } : undefined),
  });
}
