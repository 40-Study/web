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
