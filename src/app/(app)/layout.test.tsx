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

  // "/contests" không còn ở đây: từ MVP "Cuộc thi" phụ huynh xem được danh sách + chi tiết.
  // Ba route con làm bài/kết quả/chứng nhận vẫn bị chặn (describe "Cuộc thi" bên dưới).
  const PARENT_BLOCKED_ROUTES = ["/achievements", "/leaderboard", "/coins", "/groups", "/my-courses", "/schedule"];

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

describe("(app)/layout — Cuộc thi (contract §7): ai xem được gì", () => {
  afterEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      activeRole: null,
      hasHydrated: false,
      sessionStatus: "checking",
    });
  });

  function renderAt(path: string, role: string | null, isAuthenticated: boolean) {
    setPath(path);
    setAuth(role, isAuthenticated);
    render(
      <AppLayout>
        <div data-testid="child">CHILD</div>
      </AppLayout>
    );
    return screen.queryByTestId("child");
  }

  const CASES: { path: string; role: string | null; auth: boolean; rendered: boolean }[] = [
    // Khách: danh sách + chi tiết render (route public)
    { path: "/contests", role: null, auth: false, rendered: true },
    { path: "/contests/thi-git", role: null, auth: false, rendered: true },
    // Phụ huynh: xem danh sách + chi tiết, bị chặn 3 route con
    { path: "/contests", role: "PARENT", auth: true, rendered: true },
    { path: "/contests/thi-git", role: "PARENT", auth: true, rendered: true },
    { path: "/contests/thi-git/play", role: "PARENT", auth: true, rendered: false },
    { path: "/contests/thi-git/result", role: "PARENT", auth: true, rendered: false },
    { path: "/contests/thi-git/certificate", role: "PARENT", auth: true, rendered: false },
    // Học viên: vào được cả 3 route con
    { path: "/contests/thi-git/play", role: "STUDENT", auth: true, rendered: true },
    { path: "/contests/thi-git/result", role: "STUDENT", auth: true, rendered: true },
    { path: "/contests/thi-git/certificate", role: "STUDENT", auth: true, rendered: true },
    // Admin: xem chỉ đọc, không bị đẩy về /admin
    { path: "/contests", role: "SYSTEM_ADMIN", auth: true, rendered: true },
    { path: "/contests/thi-git", role: "SYSTEM_ADMIN", auth: true, rendered: true },
    // Giảng viên: xem được; trang làm bài hiện thông báo của backend (403)
    { path: "/contests/thi-git", role: "TEACHER", auth: true, rendered: true },
    { path: "/contests/thi-git/play", role: "TEACHER", auth: true, rendered: true },
  ];

  for (const c of CASES) {
    it(`${c.role ?? "khách"} tại ${c.path} -> ${c.rendered ? "render" : "bị chặn"}`, () => {
      const child = renderAt(c.path, c.role, c.auth);
      if (c.rendered) expect(child).not.toBeNull();
      else expect(child).toBeNull();
    });
  }

  it("mất phiên ở route làm bài -> KHÔNG render trang (route con không còn coi là public)", () => {
    setPath("/contests/thi-git/play");
    useAuthStore.setState({ isAuthenticated: false, activeRole: null, hasHydrated: true, sessionStatus: "anonymous" });
    render(
      <AppLayout>
        <div data-testid="child">CHILD</div>
      </AppLayout>
    );
    expect(screen.queryByTestId("child")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("đăng nhập");
  });
});
