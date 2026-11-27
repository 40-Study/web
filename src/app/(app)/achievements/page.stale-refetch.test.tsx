/**
 * Q10 #148 H1/M3/L1: /achievements — thành tích, hồ sơ hoặc chứng chỉ còn cache mà refetch nền lỗi: giữ trang + MỘT thông
 * báo 'Thử lại' cho cả ba nguồn. Hộp lỗi chỉ khi nguồn lỗi CHƯA có dữ liệu, và nêu đúng nguồn lỗi (không OR sang nguồn khác).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetchAch = vi.fn(async () => undefined);
const refetchProfile = vi.fn(async () => undefined);
const refetchCerts = vi.fn(async () => undefined);
type Q = { data: unknown; isError: boolean; error?: Error };
let ach: Q;
let profile: Q;
let certs: Q;

vi.mock("@/hooks/queries/use-achievements", () => ({
  useMyAchievements: () => ({ ...ach, isLoading: false, refetch: refetchAch }),
}));
vi.mock("@/hooks/queries/use-auth", () => ({ useMe: () => ({ data: { id: "u1", full_name: "Lê Văn C", email: "c@demo.com" }, isLoading: false }) }));
vi.mock("@/stores/auth.store", () => ({ useAuthStore: () => ({ user: { id: "u1", name: "Lê Văn C" } }) }));
vi.mock("@/hooks/queries/use-user-stats", () => ({
  usePublicProfile: () => ({ ...profile, isLoading: false, refetch: refetchProfile }),
}));
vi.mock("@/hooks/queries/use-certificates", () => ({
  useMyCertificates: () => ({ ...certs, isLoading: false, refetch: refetchCerts }),
}));

import AchievementsPage from "./page";

const PROFILE = {
  stats: { total_points: 1850, level: 4, level_progress: 70, current_streak: 3, longest_streak: 9, achievement_count: 2 },
  activity: [],
};

beforeEach(() => {
  [refetchAch, refetchProfile, refetchCerts].forEach((fn) => fn.mockClear());
  ach = { data: [], isError: false };
  profile = { data: PROFILE, isError: false };
  certs = { data: { total: 2 }, isError: false };
});

describe("/achievements — Q10 #148", () => {
  it("không lỗi: không có thông báo dữ liệu cũ", () => {
    render(<AchievementsPage />);
    expect(screen.queryByText(/Không làm mới được/)).toBeNull();
  });

  it("H1: một nguồn refetch lỗi mà còn cache: giữ trang + thông báo, 'Thử lại' làm mới đúng nguồn đó", () => {
    profile = { data: PROFILE, isError: true, error: new Error("boom") };
    render(<AchievementsPage />);
    expect(screen.getByText(/1\.850 XP/)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được thành tích");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchProfile).toHaveBeenCalledTimes(1);
    expect(refetchAch).not.toHaveBeenCalled();
    expect(refetchCerts).not.toHaveBeenCalled();
  });

  it("M3: cả ba nguồn cùng lỗi mà còn cache: vẫn chỉ MỘT thông báo, làm mới cả ba", () => {
    ach = { data: [], isError: true, error: new Error("boom") };
    profile = { data: PROFILE, isError: true, error: new Error("boom") };
    certs = { data: { total: 2 }, isError: true, error: new Error("boom") };
    render(<AchievementsPage />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Thử lại" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchAch).toHaveBeenCalledTimes(1);
    expect(refetchProfile).toHaveBeenCalledTimes(1);
    expect(refetchCerts).toHaveBeenCalledTimes(1);
  });

  it("L1: hồ sơ lỗi lần đầu (chưa có data) mà thành tích còn cache: hộp lỗi nêu lỗi của HỒ SƠ, retry chỉ hồ sơ", () => {
    ach = { data: [], isError: true, error: new Error("lỗi thành tích") };
    profile = { data: undefined, isError: true, error: new Error("lỗi hồ sơ") };
    render(<AchievementsPage />);
    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/Không làm mới được/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetchProfile).toHaveBeenCalledTimes(1);
    expect(refetchAch).not.toHaveBeenCalled();
  });
});
