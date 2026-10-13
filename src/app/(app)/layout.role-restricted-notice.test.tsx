/**
 * PG-L3 (QA2 261013): phụ huynh gõ thẳng /achievements, /my-attendance... bị chuyển về /home mà không báo gì.
 * Ở HEAD toast đã có nhưng KHÔNG test nào khoá nó — bỏ dòng toast.warning trong layout vẫn xanh toàn bộ.
 */
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import AppLayout from "./layout";
import { useAuthStore } from "@/stores/auth.store";

const replace = vi.fn();
const warning = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({ toast: { warning } }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  usePathname: vi.fn(() => "/"),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));
vi.mock("@/components/layout/app-shell-layout", () => ({
  AppShellLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function renderAs(role: string, path: string) {
  vi.mocked(usePathname).mockReturnValue(path);
  useAuthStore.setState({ isAuthenticated: true, activeRole: role, hasHydrated: true, sessionStatus: "authenticated" });
  render(
    <AppLayout>
      <div>CHILD</div>
    </AppLayout>
  );
}

beforeEach(() => {
  replace.mockClear();
  warning.mockClear();
});
afterEach(() => {
  useAuthStore.setState({ isAuthenticated: false, activeRole: null, hasHydrated: false, sessionStatus: "checking" });
});

describe("(app)/layout — báo cho người dùng khi bị chuyển khỏi route không dành cho vai của họ", () => {
  it.each(["/achievements", "/my-attendance", "/my-grades", "/leaderboard"])(
    "phụ huynh vào %s -> về /home kèm thông báo nêu đúng vai trò",
    (path) => {
      renderAs("PARENT", path);
      expect(replace).toHaveBeenCalledWith("/home");
      expect(warning).toHaveBeenCalledTimes(1);
      expect(warning.mock.calls[0]?.[0]).toBe("Trang này không dành cho Phụ huynh.");
      expect(warning.mock.calls[0]?.[1]).toMatchObject({ description: expect.stringContaining("trang chủ") });
    }
  );

  it("học viên vào /achievements -> không chuyển hướng, không thông báo", () => {
    renderAs("STUDENT", "/achievements");
    expect(replace).not.toHaveBeenCalled();
    expect(warning).not.toHaveBeenCalled();
  });
});

describe("(app)/layout — /profile (F-19)", () => {
  it("admin vào /profile không bị đẩy về /admin: trang tự chuyển tới hồ sơ của họ", () => {
    renderAs("SYSTEM_ADMIN", "/profile");
    expect(replace).not.toHaveBeenCalled();
  });
});
