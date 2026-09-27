/**
 * QA 260927 A-P2-4 — admin bị `(app)/layout.tsx` ép về `/admin` ngay cả khi
 * chỉ muốn vào trang tài khoản cá nhân (đổi mật khẩu, thiết bị, thông báo,
 * tin nhắn, hồ sơ) — không có cách nào đổi mật khẩu từ `(admin)/**`.
 *
 * Mock `AppShellLayout` để cô lập logic GATE route (không cần dựng
 * QueryClientProvider cho các hook trong Header/BottomNav — không phải điều
 * test này cần chứng minh).
 */

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import AppLayout from "./layout";
import { useAuthStore } from "@/stores/auth.store";

vi.mock("@/components/layout/app-shell-layout", () => ({
  AppShellLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}));

function setPath(path: string) {
  vi.mocked(usePathname).mockReturnValue(path);
}

function setAuth(role: string | null, isAuthenticated: boolean) {
  useAuthStore.setState({
    isAuthenticated,
    activeRole: role,
    hasHydrated: true,
    sessionStatus: isAuthenticated ? "authenticated" : "anonymous",
  });
}

describe("(app)/layout — A-P2-4 admin vẫn vào được trang tài khoản cá nhân", () => {
  afterEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      activeRole: null,
      hasHydrated: false,
      sessionStatus: "checking",
    });
  });

  it("admin trên /settings -> render bình thường, KHÔNG bị đẩy về /admin", () => {
    setPath("/settings");
    setAuth("SYSTEM_ADMIN", true);
    render(
      <AppLayout>
        <div data-testid="child">CHILD</div>
      </AppLayout>
    );
    expect(screen.queryByTestId("child")).not.toBeNull();
  });

  it("admin trên /settings/devices -> render bình thường", () => {
    setPath("/settings/devices");
    setAuth("SYSTEM_ADMIN", true);
    render(
      <AppLayout>
        <div data-testid="child">CHILD</div>
      </AppLayout>
    );
    expect(screen.queryByTestId("child")).not.toBeNull();
  });

  it("admin trên /settings/family -> KHÔNG render (trang chỉ dành cho học sinh/phụ huynh, không nằm trong danh sách cho phép)", () => {
    setPath("/settings/family");
    setAuth("SYSTEM_ADMIN", true);
    render(
      <AppLayout>
        <div data-testid="child">CHILD</div>
      </AppLayout>
    );
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("admin trên /achievements (trang học sinh) -> vẫn bị chặn như cũ", () => {
    setPath("/achievements");
    setAuth("SYSTEM_ADMIN", true);
    render(
      <AppLayout>
        <div data-testid="child">CHILD</div>
      </AppLayout>
    );
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("học sinh trên /settings -> hành vi không đổi (vẫn render bình thường)", () => {
    setPath("/settings");
    setAuth("STUDENT", true);
    render(
      <AppLayout>
        <div data-testid="child">CHILD</div>
      </AppLayout>
    );
    expect(screen.queryByTestId("child")).not.toBeNull();
  });
});

describe("(app)/layout — MAJOR #1 (review PR #26): route guard đọc CÙNG bảng data-driven với menu", () => {
  afterEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      activeRole: null,
      hasHydrated: false,
      sessionStatus: "checking",
    });
  });

  const PARENT_BLOCKED_ROUTES = ["/achievements", "/leaderboard", "/coins", "/groups", "/contests", "/my-courses", "/schedule"];

  for (const path of PARENT_BLOCKED_ROUTES) {
    it(`phụ huynh gõ thẳng URL ${path} (menu đã ẩn) -> KHÔNG render, bị chặn ở route`, () => {
      setPath(path);
      setAuth("PARENT", true);
      render(
        <AppLayout>
          <div data-testid="child">CHILD</div>
        </AppLayout>
      );
      expect(screen.queryByTestId("child")).toBeNull();
    });
  }

  const PARENT_ALLOWED_ROUTES = ["/settings/family", "/messages", "/home"];

  for (const path of PARENT_ALLOWED_ROUTES) {
    it(`phụ huynh vào ${path} -> vẫn render bình thường (route dùng chung với học sinh hoặc không bị quản lý)`, () => {
      setPath(path);
      setAuth("PARENT", true);
      render(
        <AppLayout>
          <div data-testid="child">CHILD</div>
        </AppLayout>
      );
      expect(screen.queryByTestId("child")).not.toBeNull();
    });
  }

  const STUDENT_ROUTES_UNCHANGED = ["/achievements", "/leaderboard", "/coins", "/groups", "/contests", "/my-courses", "/schedule"];

  for (const path of STUDENT_ROUTES_UNCHANGED) {
    it(`học sinh vào ${path} -> không bị ảnh hưởng bởi guard mới (vẫn render)`, () => {
      setPath(path);
      setAuth("STUDENT", true);
      render(
        <AppLayout>
          <div data-testid="child">CHILD</div>
        </AppLayout>
      );
      expect(screen.queryByTestId("child")).not.toBeNull();
    });
  }
});
