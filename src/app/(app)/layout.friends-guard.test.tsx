/**
 * E2E 01/10 F1 (P2): giáo viên gõ thẳng `/friends` không bị chuyển hướng, thấy trang Bạn bè của học viên
 * kèm lỗi 403. Nguyên nhân: bảng `ROLE_SCOPED_ROUTES` lọc theo `NavRole`, mà `resolveNavRole` quy TEACHER về
 * STUDENT (để dựng menu), nên giáo viên lọt qua cổng "/friends: STUDENT". Cổng route phải khoá theo vai THẬT
 * qua `canUseFriends` (cùng hàm sidebar/bottom-nav dùng để ẩn mục menu), không suy ra từ NavRole.
 *
 * File riêng vì cần bắt đích `router.replace`, mà mock mặc định trong vitest.setup.ts tạo `vi.fn()` mới mỗi lần
 * gọi `useRouter()` nên không đọc lại được.
 */

import { cleanup, render, screen } from "@testing-library/react";
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

function renderFriendsAs(role: string | null) {
  vi.mocked(usePathname).mockReturnValue("/friends");
  useAuthStore.setState({
    isAuthenticated: role !== null,
    activeRole: role,
    hasHydrated: true,
    sessionStatus: role !== null ? "authenticated" : "anonymous",
  });
  render(
    <AppLayout>
      <div data-testid="child">CHILD</div>
    </AppLayout>
  );
  return screen.queryByTestId("child");
}

describe("(app)/layout — /friends chỉ dành cho học viên: ai không dùng được thì về trang chủ của vai đó", () => {
  beforeEach(() => replace.mockClear());
  afterEach(() => {
    useAuthStore.setState({ isAuthenticated: false, activeRole: null, hasHydrated: false, sessionStatus: "checking" });
  });

  it("học viên vào /friends -> render, không chuyển hướng", () => {
    expect(renderFriendsAs("STUDENT")).not.toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  // Bảng vai -> trang chủ của vai (ROLE_HOME_ROUTES). Giáo viên là ca lỗi F1; phụ huynh là đối chứng (đã đúng từ
  // trước, vẫn phải đúng sau khi đổi cơ chế).
  const REDIRECTS: { role: string; home: string }[] = [
    { role: "TEACHER", home: "/teacher/schedule" },
    { role: "PARENT", home: "/home" },
    { role: "SYSTEM_ADMIN", home: "/admin" },
  ];

  for (const { role, home } of REDIRECTS) {
    it(`${role} gõ thẳng /friends -> không render trang, chuyển về ${home}`, () => {
      expect(renderFriendsAs(role)).toBeNull();
      expect(replace).toHaveBeenCalledWith(home);
    });
  }

  it("đích chuyển hướng không nằm dưới /friends (không vòng lặp) và chỉ chuyển một lần", () => {
    for (const role of ["TEACHER", "PARENT", "SYSTEM_ADMIN"]) {
      cleanup(); // bỏ lần render trước, kẻo nó còn đăng ký store và gọi replace lại khi vai đổi
      replace.mockClear();
      renderFriendsAs(role);
      expect(replace).toHaveBeenCalledTimes(1);
      const target = replace.mock.calls[0][0] as string;
      expect(target === "/friends" || target.startsWith("/friends/")).toBe(false);
    }
  });
});
