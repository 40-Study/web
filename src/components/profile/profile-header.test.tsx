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
    render(<ProfileHeader user={USER} stats={STATS} isOwnProfile onEditProfile={() => {}} />);
    const classes = screen.getByRole("button", { name: /Chỉnh sửa hồ sơ/ }).className.split(/\s+/);
    expect(classes).toContain("text-white");
    expect(classes).toContain("bg-transparent");
    expect(classes).not.toContain("bg-white");
  });
});
