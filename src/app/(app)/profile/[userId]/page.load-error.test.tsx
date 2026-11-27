/**
 * Q10-STU-02: GET public-profile lỗi 5xx / mất mạng từng hiện "Hồ sơ này không tồn tại" không có "Thử lại". Chỉ 404 mới là
 * "không tồn tại"; lỗi khác phải là hộp lỗi tải + "Thử lại".
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useParams: () => ({ userId: "u-2" }) }));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: () => ({ user: { id: "viewer" }, hasHydrated: true, activeRole: null }),
}));

const refetch = vi.fn();
let mockError: unknown = null;
let mockData: Record<string, unknown> | undefined;
vi.mock("@/hooks/queries/use-auth", () => ({
  usePublicProfile: () => ({ data: mockData, isLoading: false, error: mockError, refetch }),
}));

import PublicProfilePage from "./page";
import { ApiError, NetworkError, NotFoundError } from "@/lib/errors";

const PROFILE = {
  user_id: "u-2",
  user_name: "hocvien2",
  full_name: "Học Viên Hai",
  joined_at: "2026-01-01T00:00:00Z",
  stats: { level: 3, total_points: 120, current_streak: 4, courses_completed: 2, achievement_count: 1, lessons_completed: 9, total_study_time_minutes: 300 },
  featured_achievements: [],
  activity: [],
  completed_courses: [],
};

beforeEach(() => {
  refetch.mockReset();
  mockData = undefined;
});

describe("PublicProfilePage — lỗi tải (Q10-STU-02)", () => {
  it.each([
    ["5xx", new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại")],
    ["mất mạng", new NetworkError()],
  ])("%s: hộp lỗi + 'Thử lại', KHÔNG nói hồ sơ không tồn tại", (_name, error) => {
    mockError = error;
    render(<PublicProfilePage />);
    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/không tồn tại/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("404: vẫn là thẻ 'không tồn tại', không có 'Thử lại'", () => {
    mockError = new NotFoundError();
    render(<PublicProfilePage />);
    expect(screen.getByText(/không tồn tại/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  });

  // Q10 #148 H1: refetch nền lỗi mà còn hồ sơ cache thì giữ hồ sơ nhưng PHẢI báo (trước đây im lặng).
  it("5xx mà còn hồ sơ cache: giữ hồ sơ + thông báo 'Thử lại', không có hộp lỗi", () => {
    mockData = PROFILE;
    mockError = new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");
    render(<PublicProfilePage />);
    expect(screen.getAllByText("Học Viên Hai").length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được hồ sơ");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("hồ sơ riêng tư còn cache + 5xx: vẫn báo", () => {
    mockData = { ...PROFILE, is_private: true };
    mockError = new NetworkError();
    render(<PublicProfilePage />);
    expect(screen.getByText(/chế độ riêng tư/)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được hồ sơ");
  });

  it("không lỗi: không có thông báo dữ liệu cũ", () => {
    mockData = PROFILE;
    mockError = null;
    render(<PublicProfilePage />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
