/** QA7-A04: nút quay lại chỉ có icon phải có tên cho trình đọc màn hình. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "u1" }),
  useRouter: () => ({ push, replace: vi.fn() }),
}));
vi.mock("@/hooks/queries/use-admin-users", () => ({
  useAdminUserDetail: () => ({
    data: {
      id: "u1", email: "teacher2@demo.com", user_name: "gv2", full_name: "Giáo viên Hai", avatar_url: null,
      is_active: true, is_verified: true, locked_reason: null, locked_at: null, last_login_at: null,
      created_at: "2026-01-01T00:00:00Z", phone: null, date_of_birth: null, system_roles: [],
    },
    isLoading: false, isError: false, error: null, refetch: vi.fn(),
  }),
  useAssignUserSystemRole: () => ({ mutate: vi.fn(), isPending: false }),
  useRevokeUserSystemRole: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateUserStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/queries/use-admin", () => ({ useSystemRoles: () => ({ data: [] }) }));
vi.mock("@/hooks/queries/use-org-member-roles", () => ({
  useUserOrgMemberships: () => ({ data: [], isLoading: false, isError: false, error: null }),
}));

import AdminUserDetailPage from "./page";

describe("/admin/users/[id] — QA7-A04 nút quay lại có tên", () => {
  it("nút icon quay về danh sách có tên truy cập và đưa về /admin/users", () => {
    render(<AdminUserDetailPage />);
    fireEvent.click(screen.getByRole("button", { name: "Quay lại danh sách người dùng" }));
    expect(push).toHaveBeenCalledWith("/admin/users");
  });
});
