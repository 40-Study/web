/**
 * Q3-12: nút "Chỉnh sửa hồ sơ" là chữ trắng trên nền trắng (variant="outline" có bg-white, className chỉ đổi màu chữ)
 * nên hộp trắng trống trên banner xanh. Nền phải trong suốt để chữ trắng đọc được trên banner.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/friends/profile-friend-action", () => ({
  ProfileFriendAction: () => null,
}));

import { ProfileHeader, type User, type UserStats } from "./profile-header";

const USER: User = {
  id: "u1",
  fullName: "Giảng viên A",
  username: "gva",
  level: 1,
  totalXP: 0,
  streak: 0,
  createdAt: "2026-01-01T00:00:00Z",
};

const STATS: UserStats = { streak: 0, coursesCompleted: 0, achievements: 0, lessonsCompleted: 0, totalStudyTime: 0 };

describe("ProfileHeader — nút Chỉnh sửa hồ sơ", () => {
  it("chữ trắng đi kèm nền trong suốt, không còn bg-white", () => {
    render(<ProfileHeader user={USER} stats={STATS} isOwnProfile />);
    const classes = screen.getByRole("link", { name: /Chỉnh sửa hồ sơ/ }).className.split(/\s+/);
    expect(classes).toContain("text-white");
    expect(classes).toContain("bg-transparent");
    expect(classes).not.toContain("bg-white");
  });
});

describe("ProfileHeader — hồ sơ của chính mình (Q5-T01, S5-07)", () => {
  it("'Chỉnh sửa hồ sơ' và nút máy ảnh trên avatar dẫn tới Cài đặt > Hồ sơ", () => {
    render(<ProfileHeader user={USER} stats={STATS} isOwnProfile />);
    const edit = screen.getByRole("link", { name: /Chỉnh sửa hồ sơ/ });
    const camera = screen.getByRole("link", { name: "Tải ảnh đại diện" });
    expect(edit.getAttribute("href")).toBe("/settings?section=profile");
    expect(camera.getAttribute("href")).toBe("/settings?section=profile");
  });

  it("hồ sơ người khác không có lối chỉnh sửa", () => {
    render(<ProfileHeader user={USER} stats={STATS} isOwnProfile={false} />);
    expect(screen.queryByRole("link", { name: /Chỉnh sửa hồ sơ/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "Tải ảnh đại diện" })).toBeNull();
  });

  it("XP viết đầy đủ theo vi-VN ('1.850 XP'), không rút gọn '1.9K'", () => {
    render(<ProfileHeader user={{ ...USER, totalXP: 1850 }} stats={STATS} isOwnProfile />);
    expect(screen.getByText("1.850 XP")).toBeTruthy();
    expect(screen.queryByText(/1\.9K/)).toBeNull();
  });

  it("avatar tròn: khung viền nằm trên phần tử bo tròn, không phải ô vuông quanh hình tròn nhỏ", () => {
    const { container } = render(<ProfileHeader user={USER} stats={STATS} isOwnProfile />);
    const frame = container.querySelector(".border-4") as HTMLElement;
    expect(frame.className).toContain("rounded-full");
    expect(frame.className).toContain("[&>div:first-child]:h-full");
  });
});
