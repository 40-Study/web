/**
 * QA3-16: vai trò tuỳ biến của tổ chức không được hiện dạng mã thô (QA3_TEACHER).
 * QA-C-01: chủ tổ chức thêm được người mới bằng email (GET /organizations/:id/user-lookup, backend PR #144) rồi gán
 * vai qua POST /users/:id/org-roles; lỗi 404/403 có câu giải thích; tổ chức chưa có vai nào thì nói rõ.
 */

import { fireEvent, screen, waitFor, within } from "@testing-library/react";
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
import { ApiError, ForbiddenError } from "@/lib/errors";
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

const ORG_ROLES = [
  { id: "r-owner", name: "ORG_OWNER", organization_id: "org-1", status: "active" },
  { id: "r-teacher", name: "ORG_TEACHER", organization_id: "org-1", status: "active" },
  { id: "r-student", name: "ORG_STUDENT", organization_id: "org-1", status: "active" },
];
const FOUND = { id: "u9", user_name: "student9", full_name: null, avatar_url: null, email: "student9@demo.com" };

function mockGets(opts: { roles?: object[]; lookup?: () => Promise<unknown> } = {}) {
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/organizations/org-1/members") {
      return envelope({
        user_organization_roles: [row("a1", "u1", "Giáo viên Hai", "QA3_TEACHER"), row("a2", "u2", "Chủ Tổ Chức", "ORG_OWNER")],
        total: 2,
      });
    }
    if (url === "/org-roles") return envelope({ roles: opts.roles ?? ORG_ROLES, total: 3, page: 1, page_size: 100 });
    if (url === "/organizations/org-1/user-lookup") return opts.lookup ? opts.lookup() : envelope(FOUND);
    throw new Error(`GET không mong đợi: ${url}`);
  });
}

async function openAddAndSearch(email: string) {
  renderWithProviders(<OrgMembersPage />);
  const add = await screen.findByRole("button", { name: /Thêm thành viên/ });
  await waitFor(() => expect((add as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(add);
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Email người dùng"), { target: { value: email } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Tìm" }));
  return dialog;
}

beforeEach(() => {
  resetMockApi();
  mockGets();
});

describe("/org/members", () => {
  it("vai trò tuỳ biến hiện tên dễ đọc, vai trò hệ thống hiện tiếng Việt, không còn mã thô", async () => {
    renderWithProviders(<OrgMembersPage />);
    expect(await screen.findByText("Qa3 Teacher")).toBeTruthy();
    expect(screen.queryByText("QA3_TEACHER")).toBeNull();
  });

  it("QA-C-01: tìm theo email đúng contract user-lookup, chọn vai Giảng viên rồi POST /users/:id/org-roles", async () => {
    mockApi.post.mockResolvedValue(envelope(null));
    const dialog = await openAddAndSearch(" Student9@demo.com ");

    expect(await within(dialog).findByText("student9")).toBeTruthy();
    expect(mockApi.get).toHaveBeenCalledWith(
      "/organizations/org-1/user-lookup",
      expect.objectContaining({ params: { email: "Student9@demo.com" } })
    );

    fireEvent.click(within(dialog).getByLabelText("Vai trò trong tổ chức"));
    fireEvent.click(within(dialog).getByText("Giảng viên"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Thêm thành viên" }));
    await waitFor(() => expect(mockApi.post).toHaveBeenCalled());
    expect(mockApi.post.mock.calls[0][0]).toBe("/users/u9/org-roles");
    expect(JSON.stringify(mockApi.post.mock.calls[0][1])).toContain("r-teacher");
  });

  // Body 404 đúng contract backend; service nhận 404 qua validateStatus để đọc được `code`.
  const notFound = (body: object) => () => Promise.resolve({ status: 404, data: body });

  it("404 có code USER_NOT_FOUND: báo không tìm thấy, nút thêm vẫn khoá", async () => {
    mockGets({ lookup: notFound({ code: "USER_NOT_FOUND", message: "no active user with this email" }) });
    const dialog = await openAddAndSearch("ai@demo.com");
    expect((await within(dialog).findByRole("alert")).textContent).toBe("Không tìm thấy người dùng với email này.");
    expect((within(dialog).getByRole("button", { name: "Thêm thành viên" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("404 không có code USER_NOT_FOUND (vd route chưa deploy): báo lỗi chung, không nói sai là không có người", async () => {
    mockGets({ lookup: notFound({ error: "Cannot GET /api/organizations/org-1/user-lookup" }) });
    const dialog = await openAddAndSearch("ai@demo.com");
    expect((await within(dialog).findByRole("alert")).textContent).toBe("Không tra cứu được, thử lại sau.");
  });

  it("403 khác tổ chức đang dùng: hướng dẫn chuyển tổ chức; 400: email không hợp lệ", async () => {
    mockGets({ lookup: () => Promise.reject(new ForbiddenError("forbidden: active organization does not match")) });
    const dialog = await openAddAndSearch("x@demo.com");
    expect((await within(dialog).findByRole("alert")).textContent).toContain("Chuyển sang vai Chủ tổ chức của tổ chức này");

    mockGets({ lookup: () => Promise.reject(new ApiError(400, "INVALID_EMAIL", "a valid email is required")) });
    fireEvent.click(within(dialog).getByRole("button", { name: "Tìm" }));
    await waitFor(() => expect(within(dialog).getByRole("alert").textContent).toContain("Email không hợp lệ"));
  });

  it("tổ chức chưa có vai nào: nút thêm khoá KÈM lời giải thích", async () => {
    mockGets({ roles: [] });
    renderWithProviders(<OrgMembersPage />);
    expect((await screen.findByRole("note")).textContent).toContain("chưa có vai trò nào để gán");
    expect((screen.getByRole("button", { name: /Thêm thành viên/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
