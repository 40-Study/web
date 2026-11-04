/** QA3-04: chi tiết người dùng hiện các tổ chức người đó thuộc về (tổ chức + vai trò), cạnh vai trò hệ thống. */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "u1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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
const mockMemberships = vi.fn();
vi.mock("@/hooks/queries/use-org-member-roles", () => ({ useUserOrgMemberships: () => mockMemberships() }));

import AdminUserDetailPage from "./page";

beforeEach(() => mockMemberships.mockReset());

describe("/admin/users/[id] — tổ chức của người dùng", () => {
  it("liệt kê tổ chức kèm nhãn vai trò dễ đọc (không lộ mã QA3_TEACHER)", () => {
    mockMemberships.mockReturnValue({
      data: [
        { id: "m1", user_id: "u1", role_id: "r1", organization_id: "o1", status: "active", organization: { id: "o1", name: "QA3 Org 261104" }, role: { id: "r1", name: "QA3_TEACHER" } },
      ],
      isLoading: false, isError: false, error: null,
    });
    render(<AdminUserDetailPage />);
    expect(screen.getByText("QA3 Org 261104")).toBeTruthy();
    expect(screen.getByText("Qa3 Teacher")).toBeTruthy();
    expect(screen.queryByText("QA3_TEACHER")).toBeNull();
  });

  it("chưa thuộc tổ chức nào: nói rõ, không để trống", () => {
    mockMemberships.mockReturnValue({ data: [], isLoading: false, isError: false, error: null });
    render(<AdminUserDetailPage />);
    expect(screen.getByText("Chưa thuộc tổ chức nào.")).toBeTruthy();
  });

  it("lỗi tải: hiện thông báo tiếng Việt thay vì im lặng", () => {
    mockMemberships.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("x") });
    render(<AdminUserDetailPage />);
    expect(screen.getByRole("alert").textContent).toContain("Không tải được danh sách tổ chức");
  });
});
