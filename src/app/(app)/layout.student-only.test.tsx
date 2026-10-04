/**
 * R7 (review MINOR-1): giáo viên gõ thẳng /livestream hoặc /my-grades lọt qua cổng vì resolveNavRole quy TEACHER về
 * STUDENT. Cổng route khoá theo vai THẬT qua canAccessStudentOnlyRoute (cùng hàm sidebar dùng), như /friends.
 * File riêng vì cần bắt đích router.replace.
 */

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import AppLayout from "./layout";
import { useAuthStore } from "@/stores/auth.store";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  usePathname: vi.fn(() => "/"),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/components/layout/app-shell-layout", () => ({
  AppShellLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}));

function renderAs(role: string, path: string) {
  vi.mocked(usePathname).mockReturnValue(path);
  useAuthStore.setState({ isAuthenticated: true, activeRole: role, hasHydrated: true, sessionStatus: "authenticated" });
  render(
    <AppLayout>
      <div data-testid="child">CHILD</div>
    </AppLayout>
  );
  return screen.queryByTestId("child");
}

describe("(app)/layout: /livestream và /my-grades chỉ dành cho học viên", () => {
  beforeEach(() => replace.mockClear());
  afterEach(() => {
    useAuthStore.setState({ isAuthenticated: false, activeRole: null, hasHydrated: false, sessionStatus: "checking" });
  });

  for (const path of ["/livestream", "/my-grades"]) {
    it(`học viên vào ${path} -> render, không chuyển hướng`, () => {
      expect(renderAs("STUDENT", path)).not.toBeNull();
      expect(replace).not.toHaveBeenCalled();
    });

    it(`giáo viên gõ thẳng ${path} -> không render, về trang chủ giáo viên`, () => {
      expect(renderAs("TEACHER", path)).toBeNull();
      expect(replace).toHaveBeenCalledWith("/teacher/schedule");
    });

    it(`phụ huynh gõ thẳng ${path} -> không render, về /home`, () => {
      expect(renderAs("PARENT", path)).toBeNull();
      expect(replace).toHaveBeenCalledWith("/home");
    });
  }
});
