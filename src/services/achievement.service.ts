/**
 * Achievement service — fetch achievements and unlock them
 */

import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AchievementCategory = "learning" | "streak" | "social" | "coding" | "milestone";

export interface AchievementDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_url?: string;
  badge_url?: string;
  category: AchievementCategory;
  points: number;
  requirement: string;
  threshold: number;
}

export interface AchievementWithStatusDTO extends AchievementDTO {
  unlocked: boolean;
  earned_at?: string;
  progress: number;
}

type ApiResponse<T> = { message: string; data: T };

// ─── Service ─────────────────────────────────────────────────────────────────

export const achievementService = {
  /** GET /achievements — list all achievements */
  getAll: () =>
    api
      .get<ApiResponse<AchievementDTO[]>>("/achievements")
      .then((r) => r.data.data),

  /** GET /achievements/me — current user's achievements with status */
  getMyAchievements: () =>
    api
      .get<ApiResponse<AchievementWithStatusDTO[]>>("/achievements/me")
      .then((r) => r.data.data),

  /** POST /achievements/:id/unlock — unlock an achievement */
  unlock: (id: string) =>
    api
      .post<ApiResponse<AchievementWithStatusDTO>>(`/achievements/${id}/unlock`, {})
      .then((r) => r.data.data),
};
