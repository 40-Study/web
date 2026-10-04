/**
 * QA A-16: trang Thành tích hiện "1.850 / 1.200 XP" (vượt mốc), nhãn tiếng Anh (DAYS/BADGES/LEVEL/Active) và
 * cấp tự suy khác cấp của Trang chủ. Cấp và % tiến độ phải lấy từ backend, không tự bịa mốc XP.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/queries/use-achievements", () => ({ useMyAchievements: () => ({ data: [], isLoading: false }) }));
vi.mock("@/hooks/queries/use-auth", () => ({
  useMe: () => ({ data: { id: "u1", full_name: "Lê Văn C", email: "c@demo.com" }, isLoading: false }),
}));
vi.mock("@/stores/auth.store", () => ({ useAuthStore: () => ({ user: { id: "u1", name: "Lê Văn C" } }) }));
vi.mock("@/hooks/queries/use-user-stats", () => ({
  usePublicProfile: () => ({
    isLoading: false,
    data: {
      stats: { total_points: 1850, level: 4, level_progress: 70, current_streak: 3, longest_streak: 9, achievement_count: 2 },
      activity: [],
    },
  }),
}));
vi.mock("@/hooks/queries/use-certificates", () => ({ useMyCertificates: () => ({ data: { total: 2 }, isLoading: false }) }));

import AchievementsPage from "./page";

describe("AchievementsPage — cấp và XP", () => {
  it("hiện cấp và % tiến độ của backend, không có mẫu số XP tự bịa như '1.850 / 1.200'", () => {
    render(<AchievementsPage />);

    expect(screen.getByText(/1\.850 XP/)).toBeTruthy();
    expect(screen.queryByText(/\/\s*1\.200/)).toBeNull();
    expect(screen.queryByText(/\/\s*[\d.]+\s*XP/)).toBeNull();
    // Cấp 4 từ backend (Trang chủ cũng hiện cấp này), thanh tiến độ đúng 70%.
    expect(screen.getByText("4")).toBeTruthy();
    const bar = screen.getByRole("progressbar", { name: "Tiến độ cấp 4" });
    expect(bar.getAttribute("aria-valuenow")).toBe("70");
    expect(screen.getByText("Đã đạt 70% để lên cấp 5")).toBeTruthy();
  });

  it("nhãn hoàn toàn tiếng Việt, không còn DAYS/BADGES/LEVEL/Days/Active/JAN/LESS/MORE", () => {
    const { container } = render(<AchievementsPage />);
    const text = container.textContent ?? "";

    for (const english of ["DAYS", "BADGES", "LEVEL", "Days", "Active", "JAN", "LESS", "MORE", "TOP STAT", "Learner"]) {
      expect(text).not.toContain(english);
    }
    expect(text).toContain("NGÀY LIÊN TIẾP");
    expect(text).toContain("HUY HIỆU");
    expect(text).toContain("9 ngày");
  });
});