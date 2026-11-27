/**
 * Q10-ADMIN-03 (chi tiết): tài khoản người dùng tự xoá hiện "Lý do khoá: —" / "Khoá lúc: —" và nút "Mở khoá tài khoản" như
 * bị khoá. Phải hiện "Đã tự xoá", mốc tự xoá, và hành động "Khôi phục tài khoản".
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ user: {} as Record<string, unknown> }));
const mutateAsync = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "u1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/hooks/queries/use-admin-users", () => ({
  useAdminUserDetail: () => ({ data: state.user, isLoading: false, isError: false, error: null, refetch: vi.fn() }),
  useAssignUserSystemRole: () => ({ mutate: vi.fn(), isPending: false }),
  useRevokeUserSystemRole: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateUserStatus: () => ({ mutateAsync, isPending: false }),
}));
vi.mock("@/hooks/queries/use-admin", () => ({ useSystemRoles: () => ({ data: [] }) }));
vi.mock("@/hooks/queries/use-org-member-roles", () => ({
  useUserOrgMemberships: () => ({ data: [], isLoading: false, isError: false, error: null }),
}));
vi.mock("@/stores/auth.store", () => {
  const s = { user: { id: "admin-1" }, permissions: ["USERS_VIEW_ALL", "USERS_BAN"], sessionStatus: "authenticated" };
  return { useAuthStore: (selector: (x: typeof s) => unknown) => selector(s) };
});

import AdminUserDetailPage from "./page";

const BASE = {
  id: "u1", email: "x@example.com", user_name: "x", full_name: "X", avatar_url: null, is_verified: true,
  last_login_at: null, created_at: "2026-01-01T00:00:00Z", phone: null, date_of_birth: null, system_roles: [],
};

beforeEach(() => mutateAsync.mockReset().mockResolvedValue(undefined));

describe("/admin/users/[id] — Q10-ADMIN-03", () => {
  it("tự xoá: badge 'Đã tự xoá', hàng mốc tự xoá, không có 'Lý do khoá'; nút 'Khôi phục tài khoản'", () => {
    state.user = { ...BASE, is_active: false, locked_reason: null, locked_at: null, self_deleted_at: "2026-11-27T08:00:00Z" };
    render(<AdminUserDetailPage />);
    expect(screen.getByText("Đã tự xoá")).toBeTruthy();
    expect(screen.queryByText("Đã khoá")).toBeNull();
    expect(screen.getByText("Người dùng tự xoá lúc")).toBeTruthy();
    expect(screen.queryByText("Lý do khoá")).toBeNull();
    expect(screen.queryByRole("button", { name: "Mở khoá tài khoản" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Khôi phục tài khoản" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("tự xoá tài khoản");
    fireEvent.click(within(dialog).getByRole("button", { name: "Khôi phục" }));
    expect(mutateAsync).toHaveBeenCalledWith({ id: "u1", data: { is_active: true }, restore: true });
  });

  it("bị admin khoá: giữ 'Đã khoá', 'Lý do khoá', nút 'Mở khoá tài khoản'", () => {
    state.user = { ...BASE, is_active: false, locked_reason: "Spam", locked_at: "2026-11-26T00:00:00Z", self_deleted_at: null };
    render(<AdminUserDetailPage />);
    expect(screen.getByText("Đã khoá")).toBeTruthy();
    expect(screen.getByText("Lý do khoá")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mở khoá tài khoản" })).toBeTruthy();
    expect(screen.queryByText("Đã tự xoá")).toBeNull();
  });

  it("backend cũ (không có self_deleted_at) = coi là bị khoá", () => {
    state.user = { ...BASE, is_active: false, locked_reason: null, locked_at: null };
    render(<AdminUserDetailPage />);
    expect(screen.getByText("Đã khoá")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mở khoá tài khoản" })).toBeTruthy();
  });
});
