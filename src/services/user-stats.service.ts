/**
 * User stats service — public profile with stats, activity heatmap, and achievements
 */

import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserStatsDTO {
  total_points: number;
  level: number;
  level_progress: number;
  current_streak: number;
  longest_streak: number;
  total_checkins: number;
  achievement_count: number;
  courses_completed: number;
  lessons_completed: number;
  total_study_time_minutes: number;
}

export interface PublicProfileAchievement {
  id: string;
  name: string;
  icon_url?: string;
  badge_url?: string;
  category: string;
  earned_at: string;
}

export interface PublicProfileActivity {
  date: string;
  count: number;
}

export interface PublicProfileCompletedCourse {
  id: string;
  title: string;
  thumbnail_url?: string;
  completed_at: string;
}

export interface PublicProfileResponse {
  user_id: string;
  user_name: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  joined_at: string;
  stats: UserStatsDTO;
  featured_achievements: PublicProfileAchievement[];
  activity: PublicProfileActivity[];
  completed_courses: PublicProfileCompletedCourse[];
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
