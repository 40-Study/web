/**
 * QA8-A02: bảng người dùng thật sự vừa khung 942px ở 1280px (QA7-A01 chỉ bỏ ghim, bảng vẫn rộng 1040px nên nút
 * Khoá/Mở khoá khuất). Hai cột ngày gộp một ô xếp chồng, email dài bị cắt. jsdom không dàn trang nên kiểm cấu trúc.
 */
import { render, screen } from "@testing-library/react";
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

describe("AdminUsersPage — QA8-A02 bảng vừa khung 1280px", () => {
  it("gộp Ngày tạo + Đăng nhập cuối thành MỘT cột: header 6 cột, mỗi dòng 6 ô", () => {
    render(<AdminUsersPage />);
    const heads = Array.from(document.querySelectorAll("thead th"));
    expect(heads).toHaveLength(6);
    const dateHead = heads.find((th) => th.textContent?.includes("Ngày tạo"));
    expect(dateHead?.textContent).toContain("Đăng nhập cuối");
    expect(document.querySelectorAll("tbody tr:first-child td")).toHaveLength(6);
  });

  it("ô ngày hiện cả ngày tạo lẫn lần đăng nhập cuối (có nhãn cho trình đọc màn hình)", () => {
    render(<AdminUsersPage />);
    const cell = document.querySelectorAll("tbody tr:first-child td")[4];
    expect(cell.textContent).toContain("Ngày tạo:");
    expect(cell.textContent).toContain("Đăng nhập cuối:");
    expect(cell.textContent).toContain("01/09/2026");
    expect(cell.textContent).toContain("20/11/2026");
  });

  it("email dài bị cắt (truncate + max-w) nhưng đủ chữ ở title", () => {
    render(<AdminUsersPage />);
    const link = screen.getByRole("link", { name: USER.email });
    expect(link.className).toContain("truncate");
    expect(link.className).toMatch(/max-w-/);
    expect(link.getAttribute("title")).toBe(USER.email);
  });
});
