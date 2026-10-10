/**
 * A1 (QA 261008): vai trò hệ thống dựng sẵn không xoá được — nút "Xóa role" phải disabled.
 * A4: danh sách người giữ vai trò hiện tên + email từ `user` lồng nhau, không chỉ UUID.
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import RolesPage from "./page";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const BUILT_IN = { id: "role-teacher", name: "TEACHER", description: "Giảng viên" };
const CUSTOM = { id: "role-custom", name: "QA_REVIEWER", description: "Vai trò tự tạo" };
const PERMISSION = { id: "perm-1", name: "COURSES_CREATE", description: "", category: "Khoá học" };

const MEMBER = {
  id: "usr-1",
  user_id: "aaaaaaaa-1111-1111-1111-111111111111",
  system_role_id: BUILT_IN.id,
  user: {
    id: "aaaaaaaa-1111-1111-1111-111111111111",
    user_name: "teacher1",
    full_name: "Nguyễn Văn A",
    email: "teacher1@fortex.vn",
  },
  granted_at: "2026-09-27T10:00:00Z",
  status: "active",
  created_at: "2026-09-27T10:00:00Z",
  updated_at: "2026-09-27T10:00:00Z",
};

function mockBackend() {
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/system-roles") return envelope({ roles: [CUSTOM, BUILT_IN] });
    if (url === "/permissions") return envelope({ permissions: [PERMISSION], total: 1 });
    if (/^\/system-roles\/[^/]+\/users$/.test(url)) {
      return envelope({ user_system_roles: [MEMBER], total: 1, page: 1, page_size: 100 });
    }
    if (/^\/system-roles\/[^/]+\/permissions$/.test(url)) return envelope([]);
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
  mockApi.delete.mockResolvedValue({ message: "ok" });
}

beforeEach(() => {
  resetMockApi();
  mockBackend();
  useAuthStore.getState().setSessionStatus("authenticated");
  useAuthStore.getState().setPermissions(["ROLES_MANAGE_SYSTEM"]);
});

describe("/admin/roles — A1: chặn xoá vai trò hệ thống dựng sẵn", () => {
  it("nút 'Xóa role' của vai trò dựng sẵn bị disabled kèm tooltip; vai trò tự tạo vẫn bấm được", async () => {
    renderWithProviders(<RolesPage />);
    await screen.findByText("Vai trò tự tạo");

    const deleteButtons = screen.getAllByRole("button", { name: "Xóa role" }) as HTMLButtonElement[];
    expect(deleteButtons).toHaveLength(2);

    const teacherBtn = deleteButtons.find((b) =>
      (b.getAttribute("title") ?? "").includes("không thể xoá")
    );
    const customBtn = deleteButtons.find((b) => b !== teacherBtn);

    expect(teacherBtn?.disabled).toBe(true);
    expect(teacherBtn?.getAttribute("title")).toMatch(/không thể xoá/i);
    expect(customBtn?.disabled).toBe(false);
  });
});

describe("/admin/roles — A4: hiện tên/email người giữ vai trò", () => {
  it("hiện full_name + email từ `user`, KHÔNG chỉ UUID", async () => {
    renderWithProviders(<RolesPage />);
    await screen.findByText("Nguyễn Văn A");

    expect(screen.getByText("teacher1@fortex.vn")).toBeTruthy();
    // Đã có tên/email thì không còn dán UUID thô trong dòng đó.
    expect(screen.queryByText(MEMBER.user_id)).toBeNull();
  });

  it("thiếu `user` (backend không join được) -> rơi về user_id", async () => {
    mockApi.get.mockImplementation(async (url: string) => {
      if (url === "/system-roles") return envelope({ roles: [CUSTOM] });
      if (url === "/permissions") return envelope({ permissions: [PERMISSION], total: 1 });
      if (/^\/system-roles\/[^/]+\/users$/.test(url)) {
        return envelope({
          user_system_roles: [{ ...MEMBER, user: undefined }],
          total: 1,
          page: 1,
          page_size: 100,
        });
      }
      if (/^\/system-roles\/[^/]+\/permissions$/.test(url)) return envelope([]);
      throw new Error(`GET không mong đợi trong test: ${url}`);
    });

    renderWithProviders(<RolesPage />);
    expect(await screen.findByText(MEMBER.user_id)).toBeTruthy();
  });
});
