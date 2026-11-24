import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AchievementGlyph } from "./achievement-glyph";

describe("AchievementGlyph (S5-07)", () => {
  it("không có ảnh/emoji: hiện biểu tượng ngôi sao, không phải chữ cái đầu của tên", () => {
    const { container } = render(<AchievementGlyph achievement={{ name: "Chiến binh" }} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.queryByText("C")).toBeNull();
  });

  it("có emoji `icon`: hiện emoji", () => {
    render(<AchievementGlyph achievement={{ name: "Chiến binh", icon: "🏆" }} />);
    expect(screen.getByText("🏆")).toBeTruthy();
  });

  it("có badgeUrl: hiện ảnh", () => {
    render(<AchievementGlyph achievement={{ name: "Chiến binh", badgeUrl: "/badge.png" }} />);
    expect(screen.getByAltText("Chiến binh")).toBeTruthy();
  });
});
