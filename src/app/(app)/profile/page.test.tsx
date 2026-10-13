/**
 * F-19 (QA2 261013): /profile trần trả 404 dù đã đăng nhập (chỉ có /profile/[userId]). Phải chuyển tới hồ sơ của
 * chính người dùng, như tab "Cá nhân" ở bottom-nav.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

import ProfileIndexPage from "./page";

beforeEach(() => replace.mockClear());
afterEach(() => useAuthStore.setState({ user: null }));

describe("/profile", () => {
  it("đã đăng nhập: chuyển (replace) sang /profile/<id của mình>", () => {
    useAuthStore.setState({ user: { id: "u-123" } } as Partial<ReturnType<typeof useAuthStore.getState>>);
    render(<ProfileIndexPage />);
    expect(replace).toHaveBeenCalledWith("/profile/u-123");
  });

  it("chưa có thông tin người dùng: chưa chuyển hướng, hiện trạng thái đang tải", () => {
    useAuthStore.setState({ user: null });
    render(<ProfileIndexPage />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("Đang mở hồ sơ của bạn...")).toBeTruthy();
  });
});
