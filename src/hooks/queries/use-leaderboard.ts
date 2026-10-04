/**
 * React Query hooks for leaderboard rankings
 */

import { useQuery } from "@tanstack/react-query";
import { leaderboardService, type LeaderboardParams } from "@/services/leaderboard.service";
import { useAuthStore } from "@/stores/auth.store";
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

/** Các lớp của người dùng có bảng xếp hạng riêng (ô chọn lớp ở trang xếp hạng). Khách không gọi (tránh 401 thừa). */
export function useMyClassBoards() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    enabled: isAuthenticated,
    queryKey: [...leaderboardKeys.all, "classes"] as const,
    queryFn: () => leaderboardService.getMyClassBoards(),
  });
}

/** Current user's rank on the leaderboard */
export function useMyRank(params?: { period_type?: PeriodType } | PeriodType) {
  const periodType = typeof params === "string" ? params : params?.period_type;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    enabled: isAuthenticated,
    queryKey: leaderboardKeys.myRank(periodType),
    queryFn: () => leaderboardService.getMyRank(periodType ? { period_type: periodType } : undefined),
  });
}
