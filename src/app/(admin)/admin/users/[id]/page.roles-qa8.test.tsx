/**
 * QA8-A04: "+ Thêm vai trò" không mời gán vai gán-theo-tổ chức (ORG_OWNER). QA8-A05: "Gỡ" vai trò phải qua hộp xác nhận
 * và có tên truy cập riêng cho từng vai.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";

const revokeMutate = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "u1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/hooks/queries/use-admin-users", () => ({
  useAdminUserDetail: () => ({
    data: {
      id: "u1", email: "hs@demo.com", user_name: "hs", full_name: "Học Sinh", avatar_url: null,
      is_active: true, is_verified: true, locked_reason: null, locked_at: null, last_login_at: null,
      created_at: "2026-01-01T00:00:00Z", phone: null, date_of_birth: null,
      system_roles: [
        { id: "sr-student", name: "STUDENT", granted_at: "2026-01-01T00:00:00Z" },
        { id: "sr-teacher", name: "TEACHER", granted_at: "2026-01-02T00:00:00Z" },
      ],
    },
    isLoading: false, isError: false, error: null, refetch: vi.fn(),
  }),
  useAssignUserSystemRole: () => ({ mutate: vi.fn(), isPending: false }),
  useRevokeUserSystemRole: () => ({ mutate: revokeMutate, isPending: false }),
  useUpdateUserStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/queries/use-admin", () => ({
  useSystemRoles: () => ({
    data: [
      { id: "sr-student", name: "STUDENT" },
      { id: "sr-teacher", name: "TEACHER" },
      { id: "sr-org", name: "ORG_OWNER" },
      { id: "sr-parent", name: "PARENT" },
    ],
  }),
}));
vi.mock("@/hooks/queries/use-org-member-roles", () => ({
  useUserOrgMemberships: () => ({ data: [], isLoading: false, isError: false, error: null }),
}));
import AdminUserDetailPage from "./page";

beforeEach(() => {
  revokeMutate.mockReset();
  useAuthStore.setState({
    sessionStatus: "authenticated",
    permissions: ["USERS_VIEW_ALL", "ROLES_MANAGE_SYSTEM", "USERS_BAN"],
  } as never);
});

describe("/admin/users/[id] — QA8-A04 vai gán theo tổ chức", () => {
  it("danh sách '+ Thêm vai trò' không có Chủ tổ chức, vẫn có vai khác chưa gán", () => {
    render(<AdminUserDetailPage />);
    fireEvent.click(screen.getByText("+ Thêm vai trò"));
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options.some((t) => /chủ tổ chức/i.test(t ?? ""))).toBe(false);
    expect(options.length).toBe(1); // chỉ còn PARENT
  });
});

describe("/admin/users/[id] — QA8-A05 gỡ vai trò", () => {
  it("mỗi nút Gỡ có tên riêng theo vai và người dùng", () => {
    render(<AdminUserDetailPage />);
    const buttons = screen.getAllByRole("button", { name: /^Gỡ vai trò/ });
    expect(buttons).toHaveLength(2);
    expect(new Set(buttons.map((b) => b.getAttribute("aria-label"))).size).toBe(2);
    expect(buttons[0].getAttribute("aria-label")).toContain("Học Sinh");
  });

  it("bấm Gỡ chỉ mở hộp xác nhận, chưa gỡ; xác nhận mới gọi gỡ đúng vai", () => {
    render(<AdminUserDetailPage />);
    fireEvent.click(screen.getAllByRole("button", { name: /^Gỡ vai trò/ })[1]);

    expect(revokeMutate).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Học Sinh");

    fireEvent.click(within(dialog).getByRole("button", { name: "Gỡ vai trò" }));
    expect(revokeMutate).toHaveBeenCalledTimes(1);
    expect(revokeMutate.mock.calls[0][0]).toEqual({ userId: "u1", systemRoleId: "sr-teacher" });
  });

  it("huỷ hộp xác nhận thì không gỡ", () => {
    render(<AdminUserDetailPage />);
    fireEvent.click(screen.getAllByRole("button", { name: /^Gỡ vai trò/ })[0]);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Huỷ" }));
    expect(revokeMutate).not.toHaveBeenCalled();
  });
});
