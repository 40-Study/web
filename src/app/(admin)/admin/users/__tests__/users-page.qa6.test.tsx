/**
 * QA6-A11 (`?role=nope` hiện mã thô và danh sách rỗng) + QA6-A07 (tên truy cập: ô tìm kiếm, nút trang trước/sau,
 * "nút" trang hiện tại không làm gì).
 */
import { fireEvent, render, screen } from "@testing-library/react";
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
  last_login_at: null,
  created_at: "2026-09-01T00:00:00Z",
  system_roles: ["STUDENT"],
};

const ROLES = [
  { id: "r1", name: "TEACHER" },
  { id: "r2", name: "STUDENT" },
];

beforeEach(() => {
  replace.mockReset();
  mockUseSearchParams.mockReturnValue(new URLSearchParams());
  mockUseSystemRoles.mockReturnValue({ data: ROLES, isSuccess: true });
  mockUseAdminUsers.mockReturnValue({
    data: { items: [USER], total_count: 60, page: 2, limit: 20, total_pages: 3 },
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  });
});

describe("AdminUsersPage — QA6-A11 ?role= lạ", () => {
  it("?role=nope (không phải vai trò hệ thống) bị bỏ qua: lọc 'Tất cả vai trò', không gửi role=nope, URL bỏ role", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("role=nope"));
    render(<AdminUsersPage />);

    const lastParams = mockUseAdminUsers.mock.calls.at(-1)?.[0];
    expect(lastParams.role).toBeUndefined();
    expect(screen.getAllByText("Tất cả vai trò").length).toBeGreaterThan(0); // ô chọn rơi về "Tất cả"
    expect(screen.queryByText("nope")).toBeNull(); // không hiện mã thô
    expect(replace).toHaveBeenLastCalledWith("/admin/users", { scroll: false });
  });

  // Q6 #132 L6: trước khi danh sách vai trò về, `?role=nope` chưa kiểm được nên không được gửi lên API.
  it("?role=nope: chưa có danh sách vai trò -> không tải danh sách (enabled=false); có rồi -> tải một lần, không role", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("role=nope"));
    mockUseSystemRoles.mockReturnValue({ data: undefined, isSuccess: false, isPending: true });
    mockUseAdminUsers.mockClear();
    const view = render(<AdminUsersPage />);
    // Q7 #134 L-5: `every` trên danh sách rỗng luôn đúng — phải chắc là hook đã được gọi.
    expect(mockUseAdminUsers).toHaveBeenCalled();
    expect(mockUseAdminUsers.mock.calls.every((c) => c[1]?.enabled === false)).toBe(true);

    mockUseAdminUsers.mockClear();
    mockUseSystemRoles.mockReturnValue({ data: ROLES, isSuccess: true, isPending: false });
    view.rerender(<AdminUsersPage />);
    const last = mockUseAdminUsers.mock.calls.at(-1);
    expect(last?.[1]?.enabled).toBe(true);
    expect(last?.[0].role).toBeUndefined();
    expect(mockUseAdminUsers.mock.calls.some((c) => c[0].role === "nope" && c[1]?.enabled !== false)).toBe(false);
  });

  it("không có ?role= thì không chờ danh sách vai trò (tải ngay)", () => {
    mockUseSystemRoles.mockReturnValue({ data: undefined, isSuccess: false, isPending: true });
    mockUseAdminUsers.mockClear();
    render(<AdminUsersPage />);
    expect(mockUseAdminUsers.mock.calls.at(-1)?.[1]?.enabled).toBe(true);
  });

  it("?role=TEACHER hợp lệ được giữ nguyên", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("role=TEACHER"));
    render(<AdminUsersPage />);

    expect(mockUseAdminUsers.mock.calls.at(-1)?.[0].role).toBe("TEACHER");
    expect(replace).toHaveBeenLastCalledWith("/admin/users?role=TEACHER", { scroll: false });
  });
});

describe("AdminUsersPage — QA6-A07 tên truy cập", () => {
  it("ô tìm kiếm có nhãn, nút trang trước/sau có tên, trang hiện tại là nhãn chứ không phải nút", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("page=2"));
    render(<AdminUsersPage />);

    expect(screen.getByRole("textbox", { name: "Tìm người dùng" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Trang trước" }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: "Trang sau" }) as HTMLButtonElement).disabled).toBe(false);
    // "2" là trang hiện tại: không còn là nút bấm không làm gì.
    expect(screen.queryByRole("button", { name: "2" })).toBeNull();
    expect(document.querySelector('[aria-current="page"]')?.textContent).toBe("2");
  });

  it("bấm 'Trang sau' đổi sang trang tiếp theo", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("page=2"));
    render(<AdminUsersPage />);

    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));

    expect(mockUseAdminUsers.mock.calls.at(-1)?.[0].page).toBe(3);
  });
});
