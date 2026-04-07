/**
 * User stats service — public profile with stats and achievements
 */

import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PublicProfileResponse {
  user_id: string;
  user_name: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  total_points: number;
  rank?: number;
  streak_days: number;
  courses_completed: number;
  assignments_solved: number;
  achievements_count: number;
  joined_at: string;
}

type ApiResponse<T> = { message: string; data: T };

// ─── Service ─────────────────────────────────────────────────────────────────

export const userStatsService = {
  /** GET /users/:id/public-profile — public stats for any user */
  getPublicProfile: (userId: string) =>
    api
      .get<ApiResponse<PublicProfileResponse>>(`/users/${userId}/public-profile`)
      .then((r) => r.data.data),
};
