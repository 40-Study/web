import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));

import { ProfileHeader } from "./profile-header";

describe("ProfileHeader — cấp độ (QA3 Q12)", () => {
  it("hiện 'Cấp N' thay vì 'Level N'", () => {
    const user = {
      id: "u1", fullName: "An", username: "an", level: 4, totalXP: 10, streak: 1, createdAt: "2026-10-01T00:00:00Z",
    };
    const stats = { streak: 1, coursesCompleted: 0, achievements: 0, lessonsCompleted: 0, totalStudyTime: 0 };
    render(<ProfileHeader user={user} isOwnProfile={false} stats={stats} />);
    expect(screen.getByText("Cấp 4")).toBeTruthy();
    expect(screen.queryByText(/Level/)).toBeNull();
  });
});
