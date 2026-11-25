/**
 * QA7-A01 (cột "Hành động" ghim đè lên "Đăng nhập cuối" ở 1280px) + Q7 #134 L-4 (`?role=` chưa kiểm được vẫn bị gửi
 * lên API một lần khi tải danh sách vai trò thất bại).
 */
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAdminUsers = vi.fn();
const mockUseSystemRoles = vi.fn();
const mockUseSearchParams = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  usePathname: () => "/admin/users",
  useSearchParams: () => mockUseSearchParams(),
  useParams: () => ({}),
}));
vi.mock("@/hooks/queries/use-admin-users", () => ({
  useAdminUsers: (...args: unknown[]) => mockUseAdminUsers(...args),
  useUpdateUserStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/queries/use-admin", () => ({ useSystemRoles: () => mockUseSystemRoles() }));
vi.mock("@/stores/auth.store", () => {
  const state = { user: { id: "admin-1" }, permissions: ["USERS_VIEW_ALL", "USERS_BAN"], sessionStatus: "authenticated" };
  return { useAuthStore: (selector: (s: typeof state) => unknown) => selector(state) };
});

import AdminUsersPage from "../page";

const USER = {
  id: "u2",
  email: "student1@fortex.vn",
  user_name: "student1",
  full_name: "Nguyễn Văn B",
  avatar_url: null,
  is_active: true,
  is_verified: true,
  locked_reason: null,
  locked_at: null,
  last_login_at: "2026-11-20T03:00:00Z",
  created_at: "2026-09-01T00:00:00Z",
  system_roles: ["STUDENT"],
};

beforeEach(() => {
  replace.mockReset();
  mockUseAdminUsers.mockReset();
  mockUseSearchParams.mockReturnValue(new URLSearchParams());
  mockUseSystemRoles.mockReturnValue({ data: [{ id: "r1", name: "TEACHER" }], isSuccess: true, isPending: false, isError: false });
  mockUseAdminUsers.mockReturnValue({
    data: { items: [USER], total_count: 1, page: 1, limit: 20, total_pages: 1 },
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  });
});

describe("AdminUsersPage — QA7-A01 cột hành động", () => {
  it("ghim ở mobile (<sm) và từ 2xl, KHÔNG ghim ở khoảng sm..2xl (1280px) để không đè lên 'Đăng nhập cuối'", () => {
    render(<AdminUsersPage />);

    const head = Array.from(document.querySelectorAll("th")).find((th) => th.textContent?.includes("Hành động"));
    const cell = document.querySelector("tbody tr td:last-child");
    for (const el of [head, cell]) {
      const tokens = (el?.className ?? "").split(/\s+/);
      expect(tokens, "ghim mặc định cho mobile").toContain("sticky");
      expect(tokens, "hết ghim từ sm (khoảng 1280px)").toContain("sm:static");
      expect(tokens, "ghim lại từ 2xl").toContain("2xl:sticky");
    }
  });
});

describe("AdminUsersPage — Q7 #134 L-4 ?role= khi danh sách vai trò lỗi", () => {
  it("tải danh sách vai trò thất bại -> ?role=nope không bao giờ được gửi lên API (coi như 'Tất cả'), URL bỏ role", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("role=nope"));
    mockUseSystemRoles.mockReturnValue({ data: undefined, isSuccess: false, isPending: false, isError: true });
    render(<AdminUsersPage />);

    expect(mockUseAdminUsers).toHaveBeenCalled();
    const enabledCalls = mockUseAdminUsers.mock.calls.filter((c) => c[1]?.enabled !== false);
    expect(enabledCalls.length).toBeGreaterThan(0);
    expect(enabledCalls.every((c) => c[0].role === undefined)).toBe(true);
    expect(replace).toHaveBeenLastCalledWith("/admin/users", { scroll: false });
  });
});
