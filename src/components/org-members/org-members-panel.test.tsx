/**
 * QA3-04: quản lý thành viên tổ chức — thêm / đổi / gỡ vai trò, lỗi 409 hiện ngay trong hộp thoại, chủ tổ chức
 * không thấy nút thêm người mới (backend không có tìm người dùng cho vai này).
 */

import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ApiError } from "@/lib/errors";
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
const ROWS = [
  row("a1", "owner", "Chủ tổ chức", "r-owner", "ORG_OWNER"),
  row("a2", "t2", "Giáo viên Hai", "r-teacher", "QA3_TEACHER"),
];
const ROLES = [
  { id: "r-owner", name: "ORG_OWNER", organization_id: ORG, status: "active" },
  { id: "r-teacher", name: "QA3_TEACHER", organization_id: ORG, status: "active" },
  { id: "r-student", name: "QA3_STUDENT", organization_id: ORG, status: "active" },
  { id: "r-old", name: "RETIRED", organization_id: ORG, status: "inactive" },
];

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === `/organizations/${ORG}/members`) return envelope({ user_organization_roles: ROWS, total: 2 });
    if (url === "/org-roles") return envelope({ roles: ROLES, total: 4, page: 1, page_size: 100 });
    if (url === "/users") {
      return envelope({
        items: [{ id: "u9", email: "new@demo.com", user_name: "newbie", full_name: "Người Mới", avatar_url: null }],
        total_count: 1, page: 1, limit: 8, total_pages: 1,
      });
    }
    throw new Error(`GET không mong đợi: ${url}`);
  });
  mockApi.post.mockResolvedValue(envelope(null));
  mockApi.delete.mockResolvedValue({ data: { message: "ok" } });
});

async function renderPanel(props: { canAddMember: boolean; currentUserId?: string }) {
  renderWithProviders(<OrgMembersPanel orgId={ORG} {...props} />);
  await screen.findByText("Giáo viên Hai");
}

describe("OrgMembersPanel", () => {
  it("hiện nhãn vai trò dễ đọc và lấy vai trò của tổ chức theo organization_id", async () => {
    await renderPanel({ canAddMember: true });
    expect(screen.getByText("Qa3 Teacher")).toBeTruthy();
    expect(screen.queryByText("QA3_TEACHER")).toBeNull();
    expect(mockApi.get).toHaveBeenCalledWith("/org-roles", { params: { page: 1, page_size: 100, organization_id: ORG } });
  });

  it("thêm thành viên: tìm người, chọn vai trò, POST /users/:id/org-roles kèm organization_id", async () => {
    await renderPanel({ canAddMember: true });
    fireEvent.click(screen.getByRole("button", { name: /Thêm thành viên/ }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText("Tìm người dùng"), { target: { value: "moi" } });
    fireEvent.click(await within(dialog).findByText("Người Mới"));
    fireEvent.click(within(dialog).getByLabelText("Vai trò trong tổ chức"));
    fireEvent.click(within(dialog).getByTitle("QA3_STUDENT"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Thêm thành viên" }));

    await waitFor(() =>
      expect(mockApi.post).toHaveBeenCalledWith("/users/u9/org-roles", { role_ids: ["r-student"], organization_id: ORG })
    );
    expect(mockApi.get).toHaveBeenCalledWith("/users", { params: { keyword: "moi", limit: 8 } });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("không đưa vai trò đã ngừng hoạt động vào ô chọn", async () => {
    await renderPanel({ canAddMember: true });
    fireEvent.click(screen.getByRole("button", { name: /Thêm thành viên/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByTitle("RETIRED")).toBeNull();
    expect(within(dialog).getByTitle("QA3_STUDENT")).toBeTruthy();
  });

  it("409 gán trùng: hiện câu của backend ngay trong hộp thoại và giữ hộp thoại mở", async () => {
    mockApi.post.mockRejectedValue(
      new ApiError(409, "ORG_ROLE_ALREADY_ASSIGNED", "Người dùng đã có vai trò Qa3 Student trong tổ chức này")
    );
    await renderPanel({ canAddMember: true });
    fireEvent.click(screen.getByRole("button", { name: /Thêm thành viên/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Tìm người dùng"), { target: { value: "moi" } });
    fireEvent.click(await within(dialog).findByText("Người Mới"));
    fireEvent.click(within(dialog).getByLabelText("Vai trò trong tổ chức"));
    fireEvent.click(within(dialog).getByTitle("QA3_STUDENT"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Thêm thành viên" }));

    expect((await within(dialog).findByRole("alert")).textContent).toBe(
      "Người dùng đã có vai trò Qa3 Student trong tổ chức này"
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("409 tiếng Anh cũ của backend vẫn ra tiếng Việt rõ nghĩa", async () => {
    mockApi.post.mockRejectedValue(new ApiError(409, "", "roles already assigned to user: [QA3_STUDENT]"));
    await renderPanel({ canAddMember: true });
    const teacherRow = screen.getByText("Giáo viên Hai").closest("li") as HTMLElement;
    fireEvent.click(within(teacherRow).getByRole("button", { name: "Thêm vai trò" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByLabelText("Vai trò"));
    fireEvent.click(within(dialog).getByTitle("QA3_STUDENT"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Thêm vai trò" }));
    expect((await within(dialog).findByRole("alert")).textContent).toBe("Người này đã giữ vai trò đó trong tổ chức");
  });

  it("gỡ một vai trò: phải xác nhận rồi mới DELETE đúng mã dòng gán", async () => {
    await renderPanel({ canAddMember: true });
    fireEvent.click(screen.getByRole("button", { name: "Gỡ vai trò Qa3 Teacher của Giáo viên Hai" }));
    const dialog = await screen.findByRole("dialog");
    expect(mockApi.delete).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Gỡ" }));
    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith("/users/t2/org-roles/a2"));
  });

  it("đổi vai trò: gán vai trò mới TRƯỚC rồi mới gỡ vai trò cũ", async () => {
    const order: string[] = [];
    mockApi.post.mockImplementation(async () => (order.push("assign"), envelope(null)));
    mockApi.delete.mockImplementation(async () => (order.push("revoke"), { data: { message: "ok" } }));
    await renderPanel({ canAddMember: true });
    const teacherRow = screen.getByText("Giáo viên Hai").closest("li") as HTMLElement;
    fireEvent.click(within(teacherRow).getByRole("button", { name: "Đổi vai trò" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByLabelText("Vai trò"));
    fireEvent.click(within(dialog).getByTitle("QA3_STUDENT"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Đổi vai trò" }));

    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith("/users/t2/org-roles/a2"));
    expect(mockApi.post).toHaveBeenCalledWith("/users/t2/org-roles", { role_ids: ["r-student"], organization_id: ORG });
    expect(order).toEqual(["assign", "revoke"]);
  });

  it("đổi vai trò: gán thất bại (409) thì KHÔNG gỡ vai trò cũ", async () => {
    mockApi.post.mockRejectedValue(new ApiError(409, "", "roles already assigned to user: [X]"));
    await renderPanel({ canAddMember: true });
    const teacherRow = screen.getByText("Giáo viên Hai").closest("li") as HTMLElement;
    fireEvent.click(within(teacherRow).getByRole("button", { name: "Đổi vai trò" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByLabelText("Vai trò"));
    fireEvent.click(within(dialog).getByTitle("QA3_STUDENT"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Đổi vai trò" }));
    await within(dialog).findByRole("alert");
    expect(mockApi.delete).not.toHaveBeenCalled();
  });

  it("không cho tự đổi/gỡ vai trò của chính mình", async () => {
    await renderPanel({ canAddMember: true, currentUserId: "owner" });
    const ownRow = screen.getByText("Chủ tổ chức", { selector: "p" }).closest("li") as HTMLElement;
    expect((within(ownRow).getByRole("button", { name: "Đổi vai trò" }) as HTMLButtonElement).disabled).toBe(true);
    expect((within(ownRow).getByRole("button", { name: /Gỡ Chủ tổ chức khỏi tổ chức/ }) as HTMLButtonElement).disabled).toBe(true);
    const otherRow = screen.getByText("Giáo viên Hai").closest("li") as HTMLElement;
    expect((within(otherRow).getByRole("button", { name: "Đổi vai trò" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("chủ tổ chức (canAddMember=false): không có nút thêm người mới, có lời chỉ dẫn", async () => {
    await renderPanel({ canAddMember: false });
    expect(screen.queryByRole("button", { name: /Thêm thành viên/ })).toBeNull();
    expect(screen.getByText(/liên hệ quản trị viên hệ thống/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Đổi vai trò" }).length).toBe(2);
  });
});
