/** A8 (QA vòng 2, N8): avatar player lấy từ người dùng đăng nhập, không ghi cứng "TK". */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PlayerHeader } from "./player-header";
import { useAuthStore } from "@/stores/auth.store";

describe("PlayerHeader", () => {
  afterEach(() => {
    useAuthStore.setState({ user: null });
  });

  it("hiện chữ tắt của người đang học thay vì 'TK'", () => {
    useAuthStore.setState({ user: { id: "u1", email: "student1@demo.com", name: "Lê Văn C" } });
    render(<PlayerHeader courseSlug="git" />);
    expect(screen.queryByText("TK")).toBeNull();
    expect(screen.getByText("Lê")).toBeTruthy();
  });

  it("avatar dẫn tới trang hồ sơ có thật /profile/<id>, không phải /profile (404)", () => {
    useAuthStore.setState({ user: { id: "u1", email: "student1@demo.com", name: "Lê Văn C" } });
    render(<PlayerHeader courseSlug="git" />);
    expect(screen.getByRole("link", { name: "Trang cá nhân" }).getAttribute("href")).toBe("/profile/u1");
  });
});
