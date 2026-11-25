/**
 * QA7-A02: tạo vai trò hệ thống trùng tên làm `mutateAsync` reject mà handler không bắt -> unhandled rejection trong
 * console, ô tên không nói gì. Giờ lỗi được bắt: form giữ nguyên và ô tên báo "đã tồn tại" (backend mới 409
 * ERR_ROLE_NAME_EXISTS, backend cũ 400 "duplicated key not allowed").
 */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import RolesPage from "./page";
import { ApiError } from "@/lib/errors";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const CUSTOM = { id: "role-custom", name: "QA_REVIEWER", description: "Vai trò tự tạo" };

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/system-roles") return envelope({ roles: [CUSTOM] });
    if (url === "/permissions") return envelope({ permissions: [], total: 0 });
    if (/^\/system-roles\/[^/]+\/users$/.test(url)) return envelope({ user_system_roles: [], total: 0, page: 1, page_size: 100 });
    if (/^\/system-roles\/[^/]+\/permissions$/.test(url)) return envelope([]);
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
  useAuthStore.getState().setSessionStatus("authenticated");
  useAuthStore.getState().setPermissions(["ROLES_MANAGE_SYSTEM"]);
});

/** Vùng của ô tên (không lẫn với các alert khác của trang, vd bộ chọn người dùng). */
const nameField = () => (screen.getByLabelText("Tên vai trò") as HTMLInputElement).parentElement as HTMLElement;

async function submitName(name: string) {
  renderWithProviders(<RolesPage />);
  await screen.findByText("Vai trò tự tạo");
  fireEvent.change(screen.getByLabelText("Tên vai trò"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: "Tạo vai trò" }));
}

describe("/admin/roles — QA7-A02 tạo vai trò trùng tên", () => {
  it.each([
    ["409 ERR_ROLE_NAME_EXISTS (backend mới)", new ApiError(409, "ERR_ROLE_NAME_EXISTS", "Tên vai trò đã tồn tại")],
    ["400 duplicated key (backend cũ)", new ApiError(400, "UNKNOWN", "duplicated key not allowed")],
  ])("%s -> ô tên báo đã tồn tại, giữ nguyên tên đã nhập, không có unhandled rejection", async (_name, error) => {
    mockApi.post.mockRejectedValue(error);
    await submitName("STUDENT");

    const alert = await within(nameField()).findByRole("alert");
    expect(alert.textContent).toBe("Tên vai trò đã tồn tại, hãy chọn tên khác.");
    expect((screen.getByLabelText("Tên vai trò") as HTMLInputElement).value).toBe("STUDENT");
    expect(mockApi.post).toHaveBeenCalledTimes(1);
  });

  it("lỗi khác (500): form giữ nguyên, không báo 'đã tồn tại'", async () => {
    mockApi.post.mockRejectedValue(new ApiError(500, "UNKNOWN", "boom"));
    await submitName("QA7 moi");

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    expect(within(nameField()).queryByRole("alert")).toBeNull();
    expect((screen.getByLabelText("Tên vai trò") as HTMLInputElement).value).toBe("QA7 moi");
  });

  it("tạo thành công vẫn xoá form như cũ", async () => {
    mockApi.post.mockResolvedValue(envelope({ id: "r9", name: "QA7 moi" }));
    await submitName("QA7 moi");

    await waitFor(() => expect((screen.getByLabelText("Tên vai trò") as HTMLInputElement).value).toBe(""));
  });
});
