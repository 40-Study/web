/**
 * Q4-T10: giảng viên mở hồ sơ của chính mình từng thấy hồ sơ học viên (Cấp 1, 0 XP, chuỗi ngày, Thành tích, Huy hiệu).
 * Nay là thông tin giảng dạy: số khoá, học viên, đánh giá và danh sách khoá.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useParams: () => ({ userId: "t-1" }) }));

let mockAuthUserId = "t-1";
let mockActiveRole: string | null = "TEACHER";
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: () => ({ user: { id: mockAuthUserId }, hasHydrated: true, activeRole: mockActiveRole }),
}));
vi.mock("@/hooks/queries/use-auth", () => ({
  usePublicProfile: () => ({
    data: {
      user_id: "t-1",
      user_name: "teacher1",
      full_name: "Nguyễn Văn A",
      joined_at: "2026-01-01T00:00:00Z",
      stats: { level: 1, total_points: 0, current_streak: 0, courses_completed: 0, achievement_count: 0, lessons_completed: 0, total_study_time_minutes: 0 },
      featured_achievements: [],
      activity: [],
      completed_courses: [],
    },
    isLoading: false,
    error: null,
  }),
}));
vi.mock("@/hooks/queries/use-courses", () => ({
  useMyCourses: () => ({
    data: [
      { id: "c1", title: "React + Next.js", status: "published", total_students: 30, average_rating: 4.5, total_reviews: 10 },
      { id: "c2", title: "Go cơ bản", status: "draft", total_students: 2, average_rating: 3, total_reviews: 10 },
    ],
    isLoading: false,
    isError: false,
  }),
}));

// eslint-disable-next-line import/first
import PublicProfilePage from "./page";

describe("PublicProfilePage — hồ sơ của chính giảng viên", () => {
  beforeEach(() => {
    mockAuthUserId = "t-1";
    mockActiveRole = "TEACHER";
  });

  it("hiện thông tin giảng dạy, không có cấp/XP/thành tích học viên", () => {
    render(<PublicProfilePage />);
    expect(screen.getByRole("region", { name: "Thông tin giảng dạy" })).toBeTruthy();
    expect(screen.getByText("32")).toBeTruthy(); // tổng học viên
    expect(screen.getByText("3.8")).toBeTruthy(); // (4.5*10 + 3*10) / 20
    expect(screen.getByRole("link", { name: "React + Next.js" }).getAttribute("href")).toBe("/teacher/courses/c1");
    expect(screen.queryByText("Tổng XP")).toBeNull();
    expect(screen.queryByText(/Cấp 1/)).toBeNull();
    expect(screen.queryByRole("tab", { name: "Thành tích" })).toBeNull();
  });

  it("giảng viên xem hồ sơ người khác: vẫn là hồ sơ công khai bình thường", () => {
    mockAuthUserId = "someone-else";
    render(<PublicProfilePage />);
    expect(screen.queryByRole("region", { name: "Thông tin giảng dạy" })).toBeNull();
    expect(screen.getByText("Tổng XP")).toBeTruthy();
  });
});
