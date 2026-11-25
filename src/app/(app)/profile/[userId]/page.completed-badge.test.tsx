/** QA7 S7-03: ở 390px pill "Đã hoàn thành" bị bẻ thành "Đã hoàn / thành"; phải một dòng và không bị co. */
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

describe("/profile — pill 'Đã hoàn thành' (S7-03)", () => {
  it("không xuống dòng và không bị co", () => {
    render(<PublicProfilePage />);
    const classes = screen.getByText("Đã hoàn thành", { selector: "div" }).className.split(/\s+/);
    expect(classes).toContain("whitespace-nowrap");
    expect(classes).toContain("shrink-0");
  });
});
