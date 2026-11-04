/**
 * S6 — hồ sơ công khai theo cài đặt riêng tư. Backend trả `is_private: true` kèm chỉ tên + ảnh; trang không được
 * hiện một loạt số 0 như thể người đó chưa học gì (đó là đúng chỗ khiến người xem tưởng hồ sơ trống).
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useParams: () => ({ userId: "u-2" }) }));

let mockAuthUserId = "viewer";
let mockActiveRole: string | null = null;
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: () => ({ user: { id: mockAuthUserId }, hasHydrated: true, activeRole: mockActiveRole }),
}));

let mockData: Record<string, unknown> | undefined;
vi.mock("@/hooks/queries/use-auth", () => ({
  usePublicProfile: () => ({ data: mockData, isLoading: false, error: null }),
}));

import PublicProfilePage from "./page";

const baseProfile = {
  user_id: "u-2",
  user_name: "hocvien2",
  full_name: "Học Viên Hai",
  joined_at: "2026-01-01T00:00:00Z",
  stats: { level: 3, total_points: 120, current_streak: 4, courses_completed: 2, achievement_count: 1, lessons_completed: 9, total_study_time_minutes: 300 },
  featured_achievements: [],
  activity: [],
  completed_courses: [],
};

describe("PublicProfilePage riêng tư", () => {
  beforeEach(() => {
    mockAuthUserId = "viewer";
    mockActiveRole = null;
  });

  it("hồ sơ riêng tư của người khác: chỉ tên và thông báo, không có số liệu", () => {
    mockData = { ...baseProfile, is_private: true };
    render(<PublicProfilePage />);
    expect(screen.getByText("Học Viên Hai")).toBeTruthy();
    expect(screen.getByText(/chế độ riêng tư/)).toBeTruthy();
    expect(screen.queryByText("Tổng XP")).toBeNull();
    expect(screen.queryByText("Thống kê")).toBeNull();
  });

  it("hồ sơ công khai: vẫn hiện thống kê", () => {
    mockData = { ...baseProfile, is_private: false };
    render(<PublicProfilePage />);
    expect(screen.getAllByText("Thống kê").length).toBeGreaterThan(0);
    expect(screen.queryByText(/chế độ riêng tư/)).toBeNull();
  });

  it("chủ hồ sơ tự xem hồ sơ riêng tư của mình: vẫn thấy đầy đủ", () => {
    mockAuthUserId = "u-2";
    mockData = { ...baseProfile, is_private: true };
    render(<PublicProfilePage />);
    expect(screen.queryByText(/chế độ riêng tư/)).toBeNull();
  });

  // P-05 (QA3 261104): phụ huynh không học nên hồ sơ của chính họ không được hiện Level/XP/streak/thành tích.
  it("phụ huynh tự xem hồ sơ của mình: không có Level, XP, thống kê, tab Thành tích", () => {
    mockAuthUserId = "u-2";
    mockActiveRole = "PARENT";
    mockData = { ...baseProfile, is_private: false };
    render(<PublicProfilePage />);
    expect(screen.getByText("Học Viên Hai")).toBeTruthy();
    expect(screen.queryByText(/Level/)).toBeNull();
    expect(screen.queryByText(/XP/)).toBeNull();
    expect(screen.queryByText("Ngày streak")).toBeNull();
    expect(screen.queryByText("Thống kê")).toBeNull();
    expect(screen.queryByRole("tab", { name: "Thành tích" })).toBeNull();
  });

  it("học viên tự xem hồ sơ của mình: vẫn đủ Level/XP và tab Thành tích", () => {
    mockAuthUserId = "u-2";
    mockActiveRole = "STUDENT";
    mockData = { ...baseProfile, is_private: false };
    render(<PublicProfilePage />);
    expect(screen.getByText(/Level 3/)).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Thành tích" })).toBeTruthy();
  });

  it("phụ huynh xem hồ sơ của học viên khác: vẫn thấy số liệu của học viên đó", () => {
    mockAuthUserId = "parent-1";
    mockActiveRole = "PARENT";
    mockData = { ...baseProfile, is_private: false };
    render(<PublicProfilePage />);
    expect(screen.getByText(/Level 3/)).toBeTruthy();
  });
});

