import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));

import { RoleGuard } from "./role-guard";

// Review PR #33 (MINOR): layout (teacher)/(dashboard) mất phiên về /login nhưng mất đường quay lại.
describe("RoleGuard returnToCurrentPath — mất phiên giữ đường quay lại", () => {
  beforeEach(() => {
    replace.mockReset();
    window.history.replaceState({}, "", "/teacher/courses/abc?tab=students");
    useAuthStore.getState().clearServerSession();
    useAuthStore.setState({ hasHydrated: true, sessionStatus: "anonymous", isAuthenticated: false });
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("anonymous + returnToCurrentPath -> /login?redirect=<path+query hiện tại>", () => {
    render(
      <RoleGuard roles={["TEACHER"]} returnToCurrentPath>
        <p>nội dung</p>
      </RoleGuard>
    );

    expect(replace).toHaveBeenCalledWith(
      `/login?redirect=${encodeURIComponent("/teacher/courses/abc?tab=students")}`
    );
  });

  // Re-review PR #33 (MAJOR): áp cho (teacher)/(dashboard) (returnToCurrentPath) và (admin)
  // (redirectTo đã kèm ?redirect=).
  it.each([
    ["returnToCurrentPath", { returnToCurrentPath: true }],
    ["redirectTo kèm ?redirect (admin)", { redirectTo: "/login?redirect=%2Fadmin%2Fusers" }],
  ])("đăng xuất CHỦ ĐỘNG + %s -> về '/', không ?redirect", (_label, props) => {
    useAuthStore.getState().logout();

    render(
      <RoleGuard roles={["TEACHER"]} {...props}>
        <p>nội dung</p>
      </RoleGuard>
    );

    expect(replace).toHaveBeenCalledWith("/");
    expect(replace).not.toHaveBeenCalledWith(expect.stringContaining("redirect="));
  });

  it("mặc định (không bật) -> giữ nguyên redirectTo", () => {
    render(
      <RoleGuard roles={["TEACHER"]}>
        <p>nội dung</p>
      </RoleGuard>
    );

    expect(replace).toHaveBeenCalledWith("/login");
  });
});
