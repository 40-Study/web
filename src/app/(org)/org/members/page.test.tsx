/**
 * QA3-16: vai trò tuỳ biến của tổ chức không được hiện dạng mã thô (QA3_TEACHER).
 * QA3-04: chủ tổ chức quản lý vai trò của thành viên hiện có nhưng không có nút thêm người mới.
 */

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("@/hooks/queries/use-org-area", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/queries/use-org-area")>()),
  useActiveOrgId: () => "org-1",
}));

import OrgMembersPage from "./page";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const row = (id: string, userId: string, name: string, roleName: string) => ({
  id,
  user_id: userId,
  role_id: `role-${id}`,
  status: "active",
  user: { id: userId, user_name: name, full_name: name, email: `${userId}@demo.com` },
  role: { id: `role-${id}`, name: roleName },
});

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/organizations/org-1/members") {
      return envelope({
        user_organization_roles: [row("a1", "u1", "Giáo viên Hai", "QA3_TEACHER"), row("a2", "u2", "Chủ tổ chức", "ORG_OWNER")],
        total: 2,
      });
    }
    if (url === "/org-roles") return envelope({ roles: [], total: 0, page: 1, page_size: 100 });
    throw new Error(`GET không mong đợi: ${url}`);
  });
});

describe("/org/members", () => {
  it("vai trò tuỳ biến hiện tên dễ đọc, vai trò hệ thống hiện tiếng Việt, không còn mã thô", async () => {
    renderWithProviders(<OrgMembersPage />);
    expect(await screen.findByText("Qa3 Teacher")).toBeTruthy();
    expect(screen.queryByText("QA3_TEACHER")).toBeNull();
    expect(screen.getByText("Chủ tổ chức", { selector: "div" })).toBeTruthy();
  });

  it("có nút đổi/gỡ vai trò nhưng KHÔNG có 'Thêm thành viên' (chủ tổ chức không tìm được người dùng)", async () => {
    renderWithProviders(<OrgMembersPage />);
    await screen.findByText("Qa3 Teacher");
    expect(screen.getAllByRole("button", { name: "Đổi vai trò" }).length).toBe(2);
    expect(screen.queryByRole("button", { name: /Thêm thành viên/ })).toBeNull();
  });
});
