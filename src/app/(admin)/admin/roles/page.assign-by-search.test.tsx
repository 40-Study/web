/**
 * QA2 ADM-A4: gán vai trò chỉ có một ô "UUID của user" — admin phải dán UUID. Giờ chọn người theo tên/email
 * (GET /users?keyword=, contract BE3 §2). ADM-L12: nút "Reset" cạnh "Tạo role" không rõ reset cái gì.
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

const TEACHER_ROLE = { id: "role-teacher", name: "TEACHER", description: "Giảng viên" };
const HOLDER_ID = "aaaaaaaa-1111-1111-1111-111111111111";
const CANDIDATE_ID = "bbbbbbbb-2222-2222-2222-222222222222";

const holder = {
  id: "usr-1",
  user_id: HOLDER_ID,
  system_role_id: TEACHER_ROLE.id,
  user: { id: HOLDER_ID, user_name: "teacher1", full_name: "Nguyễn Văn A", email: "teacher1@fortex.vn" },
  granted_at: "2026-09-27T10:00:00Z",
  status: "active",
  created_at: "2026-09-27T10:00:00Z",
  updated_at: "2026-09-27T10:00:00Z",
};

function userItem(id: string, fullName: string | null, userName: string, email: string) {
  return {
    id, email, user_name: userName, full_name: fullName, avatar_url: null, is_active: true, is_verified: true,
    locked_reason: null, locked_at: null, last_login_at: null, created_at: "2026-01-01T00:00:00Z", system_roles: [],
  };
}

function mockBackend() {
  mockApi.get.mockImplementation(async (url: string, config?: { params?: { keyword?: string } }) => {
    if (url === "/system-roles") return envelope({ roles: [TEACHER_ROLE] });
    if (url === "/permissions") return envelope({ permissions: [], total: 0 });
    if (/^\/system-roles\/[^/]+\/users$/.test(url)) {
      return envelope({ user_system_roles: [holder], total: 1, page: 1, page_size: 100 });
    }
    if (/^\/system-roles\/[^/]+\/permissions$/.test(url)) return envelope([]);
    if (url === "/users") {
      return envelope({
        items: [
          userItem(HOLDER_ID, "Nguyễn Văn A", "teacher1", "teacher1@fortex.vn"),
          userItem(CANDIDATE_ID, "Nguyễn Văn B", "student9", "b@fortex.vn"),
        ],
        total_count: 2, page: 1, limit: 10, total_pages: 1,
        // Phản hồi giả không lọc theo keyword; test kiểm tham số gửi đi, không kiểm việc lọc của backend.
        _keyword: config?.params?.keyword,
      });
    }
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
  mockApi.post.mockResolvedValue({ data: { message: "ok" } });
}

beforeEach(() => {
  resetMockApi();
  mockBackend();
  useAuthStore.getState().setSessionStatus("authenticated");
  useAuthStore.getState().setPermissions(["ROLES_MANAGE_SYSTEM"]);
});

async function openPage() {
  renderWithProviders(<RolesPage />);
  await screen.findByText("Nguyễn Văn A"); // đã tải vai trò + người giữ vai trò
}

describe("/admin/roles — A4: gán vai trò bằng tìm kiếm thay vì dán UUID", () => {
  it("không còn ô 'UUID của user'; có ô tìm theo tên/email", async () => {
    await openPage();
    expect(screen.queryByPlaceholderText("UUID của user")).toBeNull();
    expect(screen.getByLabelText("Tìm người dùng theo tên hoặc email")).toBeTruthy();
  });

  it("gõ từ khoá -> GET /users?keyword (đã debounce), hiện tên + email; ứng viên đã giữ vai trò bị loại", async () => {
    await openPage();
    fireEvent.change(screen.getByLabelText("Tìm người dùng theo tên hoặc email"), { target: { value: "nguyen" } });

    await waitFor(() =>
      expect(mockApi.get).toHaveBeenCalledWith("/users", { params: { keyword: "nguyen", page: 1, limit: 10 } }),
    );
    expect(await screen.findByText("b@fortex.vn")).toBeTruthy();
    // Người đã giữ vai trò TEACHER không xuất hiện trong ứng viên (vẫn có trong danh sách người giữ vai trò ở trên).
    expect(screen.queryByRole("button", { name: "Gán vai trò Nguyễn Văn A" })).toBeNull();
    // Mỗi lần gõ không bắn một request: chỉ một lượt có keyword này.
    expect(mockApi.get.mock.calls.filter((c) => c[0] === "/users" && c[1]?.params?.keyword === "nguyen")).toHaveLength(1);
  });

  it("bấm 'Gán vai trò' trên ứng viên -> POST /users/:id/system-roles với đúng id vai trò đang chọn", async () => {
    await openPage();
    fireEvent.change(screen.getByLabelText("Tìm người dùng theo tên hoặc email"), { target: { value: "nguyen" } });
    fireEvent.click(await screen.findByRole("button", { name: "Gán vai trò Nguyễn Văn B" }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    expect(mockApi.post).toHaveBeenCalledWith(`/users/${CANDIDATE_ID}/system-roles`, {
      system_role_ids: [TEACHER_ROLE.id],
    });
  });
});

describe("/admin/roles — L12: nút Reset không rõ nghĩa", () => {
  it("nút đặt lại biểu mẫu ghi rõ việc nó làm, và xoá nội dung đã nhập", async () => {
    await openPage();
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();

    const nameInput = screen.getByPlaceholderText("Tên vai trò") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "QA_REVIEWER" } });
    fireEvent.click(screen.getByRole("button", { name: "Xoá nội dung đã nhập" }));
    expect(nameInput.value).toBe("");
  });

  it("đang sửa vai trò: nút ghi 'Huỷ sửa' và thoát chế độ sửa", async () => {
    await openPage();
    fireEvent.click(screen.getByRole("button", { name: "Sửa role" }));
    expect(screen.getByText("Cập nhật vai trò")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Huỷ sửa" }));
    expect(screen.getByText("Tạo vai trò mới")).toBeTruthy();
  });
});
