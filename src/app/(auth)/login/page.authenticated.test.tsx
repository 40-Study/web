/**
 * A-01 (QA3 261104): người đã đăng nhập mở /login vẫn thấy form đăng nhập. Phải về trang chủ của vai trò.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/queries/use-auth", () => ({ useLogin: () => ({ mutate: vi.fn(), isPending: false }) }));

import LoginPage from "./page";

beforeEach(() => replace.mockReset());

describe("LoginPage — đã đăng nhập", () => {
  it("phụ huynh đã đăng nhập: chuyển về /home và không vẽ form", () => {
    useAuthStore.setState({ sessionStatus: "authenticated", isAuthenticated: true, activeRole: "PARENT" });
    render(<LoginPage />);
    expect(replace).toHaveBeenCalledWith("/home");
    expect(screen.queryByLabelText("Email")).toBeNull();
  });

  it("giảng viên đã đăng nhập: về trang chủ giảng viên", () => {
    useAuthStore.setState({ sessionStatus: "authenticated", isAuthenticated: true, activeRole: "TEACHER" });
    render(<LoginPage />);
    expect(replace).toHaveBeenCalledWith("/teacher/schedule");
  });

  it("khách: vẫn thấy form", () => {
    useAuthStore.setState({ sessionStatus: "anonymous", isAuthenticated: false, activeRole: null });
    render(<LoginPage />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email")).toBeTruthy();
  });
});
