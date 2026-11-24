/**
 * QA5 review #127 mục 11: khoá đã hoàn thành ở /profile và thẻ chứng chỉ ở /my-courses dùng MỘT định dạng
 * ("Hoàn thành tháng 10/2026"), không còn "Hoàn thành 8 tháng 10, 2026".
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useParams: () => ({ userId: "u-2" }) }));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: () => ({ user: { id: "viewer" }, hasHydrated: true, activeRole: null }),
}));
vi.mock("@/hooks/queries/use-auth", () => ({
  usePublicProfile: () => ({
    isLoading: false,
    error: null,
    data: {
      user_id: "u-2", user_name: "hocvien2", full_name: "Học Viên Hai", joined_at: "2026-01-01T00:00:00Z", is_private: false,
      stats: { level: 3, total_points: 120, current_streak: 4, courses_completed: 1, achievement_count: 0, lessons_completed: 9, total_study_time_minutes: 300 },
      featured_achievements: [], activity: [],
      completed_courses: [{ id: "c1", title: "Khoá Python", thumbnail_url: "", completed_at: new Date(2026, 9, 8, 12).toISOString() }],
    },
  }),
}));

import PublicProfilePage from "./page";

describe("/profile — ngày hoàn thành khoá học", () => {
  it("'Hoàn thành tháng 10/2026'", () => {
    render(<PublicProfilePage />);
    expect(screen.getByText("Khoá Python")).toBeTruthy();
    expect(screen.getByText("Hoàn thành tháng 10/2026")).toBeTruthy();
    expect(screen.queryByText(/8 tháng 10/)).toBeNull();
  });
});
