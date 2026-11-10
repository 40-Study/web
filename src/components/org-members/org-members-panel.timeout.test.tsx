/**
 * QA-C-16 (261110): gỡ thành viên khi server chậm — request bị timeout nhưng server đã gỡ xong. Trước đây hộp thoại
 * kẹt mở, báo lỗi chung và danh sách vẫn còn người đó. Giờ: tải lại, đối chiếu, đóng hộp thoại nếu đã gỡ.
 */

import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

import { toast } from "sonner";
import { NetworkError } from "@/lib/errors";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import { OrgMembersPanel } from "./org-members-panel";

const ORG = "org-1";
const row = (id: string, userId: string, name: string, roleId: string, roleName: string) => ({
  id,
  user_id: userId,
  role_id: roleId,
  status: "active",
  user: { id: userId, user_name: name, full_name: name, email: `${userId}@demo.com` },
  role: { id: roleId, name: roleName },
});
const OWNER = row("a1", "owner", "Chủ tổ chức", "r-owner", "ORG_OWNER");
const TEACHER = row("a2", "t2", "Giáo viên Hai", "r-teacher", "QA3_TEACHER");
const ROLES = [
  { id: "r-owner", name: "ORG_OWNER", organization_id: ORG, status: "active" },
  { id: "r-teacher", name: "QA3_TEACHER", organization_id: ORG, status: "active" },
];

let serverRows = [OWNER, TEACHER];

beforeEach(() => {
  resetMockApi();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
  serverRows = [OWNER, TEACHER];
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === `/organizations/${ORG}/members`) return envelope({ user_organization_roles: serverRows, total: serverRows.length });
    if (url === "/org-roles") return envelope({ roles: ROLES, total: 2, page: 1, page_size: 100 });
    throw new Error(`GET không mong đợi: ${url}`);
  });
});

async function openRemoveDialog() {
  renderWithProviders(<OrgMembersPanel orgId={ORG} canAddMember />);
  await screen.findByText("Giáo viên Hai");
  fireEvent.click(screen.getByRole("button", { name: /Gỡ Giáo viên Hai khỏi tổ chức/ }));
  return screen.findByRole("dialog");
}

describe("OrgMembersPanel — gỡ thành viên khi request timeout (QA-C-16)", () => {
  it("server đã gỡ xong: tải lại, đóng hộp thoại, danh sách hết người đó, không toast lỗi", async () => {
    // Server xử lý xong (row biến mất) nhưng client chỉ nhận timeout.
    mockApi.delete.mockImplementation(async () => {
      serverRows = [OWNER];
      throw new NetworkError();
    });
    const dialog = await openRemoveDialog();

    fireEvent.click(within(dialog).getByRole("button", { name: "Gỡ" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByText("Giáo viên Hai")).toBeNull();
    expect(toast.success).toHaveBeenCalledWith("Đã gỡ thành viên khỏi tổ chức");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("server chưa ghi nhận: giữ hộp thoại, báo 'Chưa rõ kết quả' thay vì lỗi chắc chắn", async () => {
    mockApi.delete.mockRejectedValue(new NetworkError());
    const dialog = await openRemoveDialog();

    fireEvent.click(within(dialog).getByRole("button", { name: "Gỡ" }));

    const alert = await within(dialog).findByRole("alert");
    expect(alert.textContent).toMatch(/^Chưa rõ kết quả\./);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
