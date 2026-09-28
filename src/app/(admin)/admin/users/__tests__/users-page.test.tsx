/**
 * Test trang /admin/users — loading/empty/error, dialog khoá bắt buộc nhập
 * lý do, và đảm bảo KHÔNG có optimistic update sai (UI chỉ đổi sau 200 thật).
 *
 * Mock ở tầng hook (use-admin-users / use-admin / auth.store) thay vì mock
 * api-client — page chỉ cần đúng luồng render/tương tác, đã có
 * user.service.test.ts riêng cho tầng gọi API.
 *
 * Repo không đăng ký @testing-library/jest-dom (không có `expect.extend` trong
 * vitest.setup.ts) — dùng thẳng matcher Vitest gốc (`toBeTruthy`, `toBeNull`,
 * kiểm `.disabled` trực tiếp) thay vì `toBeInTheDocument`/`toBeDisabled`.
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminUserListItem } from "@/types/user";

const mockUseAdminUsers = vi.fn();
const mockUseUpdateUserStatus = vi.fn();
const mockUseSystemRoles = vi.fn();

// vitest.setup.ts mock next/navigation bằng arrow function thường (không phải
// vi.fn()) nên không control được qua vi.mocked() từ trong test — ghi đè cục
// bộ ở đây bằng bản vi.fn() thật để mỗi test tự set searchParams/router.
const mockUseRouter = vi.fn();
const mockUsePathname = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => mockUseRouter(),
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/hooks/queries/use-admin-users", () => ({
  useAdminUsers: (...args: unknown[]) => mockUseAdminUsers(...args),
  useUpdateUserStatus: () => mockUseUpdateUserStatus(),
}));

vi.mock("@/hooks/queries/use-admin", () => ({
  useSystemRoles: () => mockUseSystemRoles(),
}));

const authState = {
  user: { id: "admin-1", email: "admin@fortex.vn", name: "Admin" },
  permissions: ["USERS_VIEW_ALL", "USERS_BAN", "ROLES_MANAGE_SYSTEM"],
  sessionStatus: "authenticated" as const,
};

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

import AdminUsersPage from "../page";

function buildUser(overrides: Partial<AdminUserListItem> = {}): AdminUserListItem {
  return {
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
    ...overrides,
  };
}

beforeEach(() => {
  mockUseSystemRoles.mockReturnValue({ data: [] });
  mockUseUpdateUserStatus.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  mockUsePathname.mockReturnValue("/admin/users");
  mockUseSearchParams.mockReturnValue(new URLSearchParams());
  mockUseRouter.mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  });
});

describe("AdminUsersPage — loading/empty/error", () => {
  it("hiển thị skeleton khi đang tải", () => {
    mockUseAdminUsers.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AdminUsersPage />);

    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("hiển thị empty-state trung thực khi danh sách rỗng", () => {
    mockUseAdminUsers.mockReturnValue({
      data: { items: [], total_count: 0, page: 1, limit: 20, total_pages: 1 },
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AdminUsersPage />);

    expect(screen.getByText("Không tìm thấy người dùng nào")).toBeTruthy();
  });

  it("hiển thị thông báo lỗi kèm nút Thử lại khi query lỗi", () => {
    const refetch = vi.fn();
    mockUseAdminUsers.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Không thể tải dữ liệu người dùng"),
      refetch,
    });

    render(<AdminUsersPage />);

    expect(screen.getByText("Không thể tải dữ liệu")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

describe("AdminUsersPage — khoá tài khoản", () => {
  it("không cho tự khoá tài khoản của chính mình", () => {
    mockUseAdminUsers.mockReturnValue({
      data: {
        items: [buildUser({ id: "admin-1", email: "admin@fortex.vn" })],
        total_count: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      },
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AdminUsersPage />);

    const btn = screen.getByRole("button", { name: /khoá$/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("bắt buộc nhập lý do trước khi khoá — nút chỉ bật khi có lý do", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockUseUpdateUserStatus.mockReturnValue({ mutateAsync, isPending: false });
    mockUseAdminUsers.mockReturnValue({
      data: { items: [buildUser()], total_count: 1, page: 1, limit: 20, total_pages: 1 },
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AdminUsersPage />);

    fireEvent.click(screen.getByRole("button", { name: /khoá$/i }));

    const confirmBtn = screen.getByRole("button", { name: "Khoá tài khoản" }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);

    const textarea = screen.getByLabelText(/lý do khoá/i);
    fireEvent.change(textarea, { target: { value: "Vi phạm điều khoản sử dụng" } });

    expect(confirmBtn.disabled).toBe(false);

    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      id: "u2",
      data: { is_active: false, reason: "Vi phạm điều khoản sử dụng" },
    });
  });

  it("KHÔNG optimistic — dialog chỉ đóng sau khi mutation thật resolve (200)", async () => {
    let resolveMutation: () => void = () => {};
    const mutateAsync = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveMutation = resolve;
        })
    );
    mockUseUpdateUserStatus.mockReturnValue({ mutateAsync, isPending: false });
    mockUseAdminUsers.mockReturnValue({
      data: { items: [buildUser()], total_count: 1, page: 1, limit: 20, total_pages: 1 },
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AdminUsersPage />);

    fireEvent.click(screen.getByRole("button", { name: /khoá$/i }));
    fireEvent.change(screen.getByLabelText(/lý do khoá/i), {
      target: { value: "Vi phạm điều khoản sử dụng" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Khoá tài khoản" }));

    // Trước khi promise resolve — dialog vẫn phải còn mở (chưa có 200 thật).
    expect(screen.getByText(/Khoá tài khoản "student1@fortex.vn"/)).toBeTruthy();

    await act(async () => {
      resolveMutation();
      await Promise.resolve();
    });

    // Sau khi resolve — dialog mới đóng.
    await waitFor(() => {
      expect(screen.queryByText(/Khoá tài khoản "student1@fortex.vn"/)).toBeNull();
    });
  });
});

// URL-state-first (yêu cầu coordinator sau vụ e2e khoá nhầm parent1@demo.com vì
// /admin/users?keyword=student2 không lọc sẵn danh sách): mở link kèm query
// phải lọc NGAY từ lần render đầu, gõ/lọc phải ghi lại URL (replace, debounce).
describe("AdminUsersPage — đồng bộ bộ lọc với URL", () => {
  it("mở /admin/users?keyword=student2 → ô tìm kiếm và query gọi API đã lọc sẵn student2 (không cần gõ lại)", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("keyword=student2"));
    mockUseAdminUsers.mockReturnValue({
      data: {
        items: [buildUser({ id: "u-student2", email: "student2@demo.com" })],
        total_count: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      },
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AdminUsersPage />);

    const input = screen.getByPlaceholderText(/Tìm theo email/i) as HTMLInputElement;
    expect(input.value).toBe("student2");
    // Ngay lần render đầu — không đợi debounce — vì giá trị debounce khởi tạo
    // bằng chính giá trị URL (useDebouncedValue seed từ useState(value)).
    expect(mockUseAdminUsers).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "student2" })
    );
    expect(screen.getByText("student2@demo.com")).toBeTruthy();
  });

  it("mở /admin/users?role=TEACHER&status=locked&page=2 → khởi tạo đúng filter role/status/page từ URL", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("role=TEACHER&status=locked&page=2"));
    mockUseAdminUsers.mockReturnValue({
      data: { items: [], total_count: 0, page: 2, limit: 20, total_pages: 3 },
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AdminUsersPage />);

    expect(mockUseAdminUsers).toHaveBeenCalledWith(
      expect.objectContaining({ role: "TEACHER", status: "locked", page: 2 })
    );
  });

  it("gõ vào ô tìm kiếm → URL được replace (debounce) với ?keyword=..., không push (không thêm history)", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    const replace = vi.fn();
    const push = vi.fn();
    mockUseRouter.mockReturnValue({
      push,
      replace,
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    });
    mockUseAdminUsers.mockReturnValue({
      data: { items: [], total_count: 0, page: 1, limit: 20, total_pages: 1 },
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AdminUsersPage />);

    fireEvent.change(screen.getByPlaceholderText(/Tìm theo email/i), {
      target: { value: "student2" },
    });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        expect.stringContaining("?keyword=student2"),
        expect.objectContaining({ scroll: false })
      );
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("URL rỗng khi mọi filter về mặc định (keyword rỗng, ALL, trang 1) — không rác query string", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    const replace = vi.fn();
    mockUseRouter.mockReturnValue({
      push: vi.fn(),
      replace,
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    });
    mockUseAdminUsers.mockReturnValue({
      data: { items: [], total_count: 0, page: 1, limit: 20, total_pages: 1 },
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AdminUsersPage />);

    expect(replace).toHaveBeenCalledWith("/admin/users", { scroll: false });
  });
});

describe("AdminUsersPage — QA vòng 2 G6 (N-04): nhãn trạng thái tiếng Việt", () => {
  it("badge trạng thái hiện 'Đang hoạt động'/'Đã khoá', không còn 'Active'/'Locked'", () => {
    mockUseAdminUsers.mockReturnValue({
      data: {
        items: [
          buildUser({ id: "u-active", email: "on@fortex.vn", is_active: true }),
          buildUser({ id: "u-locked", email: "off@fortex.vn", is_active: false }),
        ],
        total_count: 2,
        page: 1,
        limit: 20,
        total_pages: 1,
      },
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AdminUsersPage />);

    expect(screen.queryByText("Active")).toBeNull();
    expect(screen.queryByText("Locked")).toBeNull();
    expect(screen.getAllByText("Đang hoạt động").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Đã khoá").length).toBeGreaterThan(0);
  });
});
