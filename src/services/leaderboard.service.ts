/**
 * Leaderboard service — global rankings and personal rank
 */

import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

// Khớp enum kỳ của backend (model.IsValidLeaderboardPeriodType): backend không có kỳ theo ngày.
export type PeriodType = "weekly" | "monthly" | "all_time";

/**
 * Một dòng bảng xếp hạng. Người đặt `leaderboard_display = anonymous` (và người xem không phải chính họ hay admin)
 * KHÔNG có user_id, user_name, full_name, avatar_url: backend bỏ hẳn các field đó vì id dẫn tới hồ sơ công khai.
 * `display_name` luôn có và là nhãn nên hiển thị ("Học viên ẩn danh" khi ẩn danh).
 */
export interface LeaderboardEntryDTO {
  rank: number;
  user_id?: string;
  user_name?: string;
  full_name?: string;
  avatar_url?: string;
  display_name: string;
  points: number;
  is_me?: boolean;
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
