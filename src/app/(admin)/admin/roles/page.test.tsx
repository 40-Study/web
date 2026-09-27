/**
 * A-P1-1 + A-P1-2 regression — trang /admin/roles trước đây:
 *  - luôn hiển thị "3 users" giả với email @fortex.vn (seedUsersForRole), không gọi API nào.
 *  - "Tạo role" chỉ gửi {name, description}, KHÔNG gửi quyền đã tick (submitRole cũ).
 *
 * Hai test dưới ĐỎ nếu revert về hành vi cũ: test 1 sẽ thấy "3 user"/"@fortex.vn"; test 2 sẽ
 * không thấy mockApi.put được gọi tới endpoint /system-roles/:id/permissions.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import RolesPage from "./page";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const ROLE = { id: "role-a", name: "TEACHER", description: "Giảng viên" };
const PERMISSION = { id: "perm-1", name: "COURSES_CREATE", description: "", category: "Khoá học" };

function mockBackend() {
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/system-roles") return envelope({ roles: [ROLE] });
    if (url === "/permissions") return envelope({ permissions: [PERMISSION], total: 1 });
    if (/^\/system-roles\/[^/]+\/users$/.test(url)) {
      return envelope({
        user_system_roles: [
          {
            id: "usr-1",
            user_id: "aaaaaaaa-1111-1111-1111-111111111111",
            system_role_id: ROLE.id,
            granted_at: "2026-09-27T10:00:00Z",
            status: "active",
            created_at: "2026-09-27T10:00:00Z",
            updated_at: "2026-09-27T10:00:00Z",
          },
        ],
        total: 2,
        page: 1,
        page_size: 100,
      });
    }
    if (/^\/system-roles\/[^/]+\/permissions$/.test(url)) return envelope([]);
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });

  mockApi.post.mockImplementation(async (url: string, data: unknown) => {
    if (url === "/system-roles") {
      const body = data as { name: string; description?: string };
      return envelope({ id: "role-new", name: body.name, description: body.description });
    }
    throw new Error(`POST không mong đợi trong test: ${url}`);
  });

  mockApi.put.mockImplementation(async (url: string) => {
    if (/\/system-roles\/[^/]+\/permissions$/.test(url)) return envelope(null);
    throw new Error(`PUT không mong đợi trong test: ${url}`);
  });
}

beforeEach(() => {
  resetMockApi();
  mockBackend();
  useAuthStore.getState().setSessionStatus("authenticated");
  useAuthStore.getState().setPermissions(["ROLES_MANAGE_SYSTEM"]);
});

describe("/admin/roles — A-P1-1: không còn user giả", () => {
  it("hiển thị số user THẬT từ API, không phải '3 users' cố định kiểu @fortex.vn", async () => {
    renderWithProviders(<RolesPage />);

    // total thật = 2 (mock), tuyệt đối không phải hardcode "3"
    await screen.findByText("2 user");

    expect(screen.queryByText(/3 users?/i)).toBeNull();
    expect(screen.queryByText(/@fortex\.vn/i)).toBeNull();
  });
});

describe("/admin/roles — A-P1-2: tạo role phải lưu quyền đã tick", () => {
  it("tick 1 quyền rồi Tạo role -> gọi PUT /system-roles/:id/permissions với đúng permission_id", async () => {
    renderWithProviders(<RolesPage />);

    await screen.findByText("2 user"); // đợi load xong

    fireEvent.change(screen.getByPlaceholderText("Tên vai trò"), {
      target: { value: "QA-role" },
    });

    const checkbox = screen.getByRole("checkbox", { name: PERMISSION.name });
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByRole("button", { name: "Tạo role" }));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/system-roles",
        expect.objectContaining({ name: "QA-role" })
      );
    });

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith(
        "/system-roles/role-new/permissions",
        expect.objectContaining({ permission_ids: [PERMISSION.id] })
      );
    });
  });
});

describe("/admin/roles — review PR #24 (MINOR): phân biệt lỗi/không có quyền với đang tải", () => {
  it("GET /system-roles/:id/users lỗi (vd 403 thiếu quyền) -> hiện 'lỗi', KHÔNG kẹt '…' mãi mãi", async () => {
    mockApi.get.mockImplementation(async (url: string) => {
      if (url === "/system-roles") return envelope({ roles: [ROLE] });
      if (url === "/permissions") return envelope({ permissions: [PERMISSION], total: 1 });
      if (/^\/system-roles\/[^/]+\/users$/.test(url)) throw new Error("403 Forbidden");
      if (/^\/system-roles\/[^/]+\/permissions$/.test(url)) return envelope([]);
      throw new Error(`GET không mong đợi trong test: ${url}`);
    });

    renderWithProviders(<RolesPage />);

    await screen.findByText("lỗi");
    expect(screen.queryByText("…")).toBeNull();
    expect(screen.queryByText(/2 user/)).toBeNull();
  });
});
