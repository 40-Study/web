/**
 * Leaderboard service — global rankings and personal rank
 */

import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PeriodType = "daily" | "weekly" | "monthly" | "all_time";

export interface LeaderboardEntryDTO {
  rank: number;
  user_id: string;
  user_name: string;
  full_name?: string;
  avatar_url?: string;
  points: number;
}

export interface LeaderboardResponse {
  period_type: PeriodType;
  period: string;
  entries: LeaderboardEntryDTO[];
  total: number;
}

export interface MyRankResponse {
  period_type: PeriodType;
  period: string;
  entry: LeaderboardEntryDTO;
}

export interface LeaderboardParams {
  period_type?: PeriodType;
  limit?: number;
  page?: number;
}

type ApiResponse<T> = { message: string; data: T };

// ─── Service ─────────────────────────────────────────────────────────────────

export const leaderboardService = {
  /** GET /leaderboard — global leaderboard */
  getLeaderboard: (params?: LeaderboardParams) =>
    api
      .get<ApiResponse<LeaderboardResponse>>("/leaderboard", { params })
      .then((r) => r.data.data),

  /** GET /leaderboard/me — current user's rank */
  getMyRank: (params?: Pick<LeaderboardParams, "period_type">) =>
    api
      .get<ApiResponse<MyRankResponse>>("/leaderboard/me", { params })
      .then((r) => r.data.data),
};
