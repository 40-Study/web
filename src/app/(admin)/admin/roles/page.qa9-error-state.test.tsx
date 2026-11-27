/**
 * QA9-ADMIN-01: GET /system-roles lỗi (500) thì cột trái trống trơn, không có thông báo, không có "Thử lại" — trông như
 * "chưa có vai trò nào"; ô chọn quyền của "Tạo vai trò mới" cũng trống im lặng khi GET /permissions lỗi.
 * QA9-ADMIN-04: nút "Sửa vai trò" / "Xoá vai trò" trên các thẻ phải có tên riêng theo vai trò.
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

const TEACHER = { id: "role-teacher", name: "TEACHER", description: "Giảng viên" };
const CUSTOM = { id: "role-custom", name: "QA_REVIEWER", description: "Vai trò tự tạo" };
const PERMISSION = { id: "perm-1", name: "COURSES_CREATE", description: "", category: "Khoá học" };

/** Hộp lỗi của QueryState (trang còn có alert "Không tải được danh sách" của ô chọn người dùng, không liên quan). */
const findQueryErrorBox = () =>
  waitFor(() => {
    const box = screen.getAllByRole("alert").find((el) => el.textContent?.includes("Không thể tải dữ liệu"));
    expect(box).toBeTruthy();
    return box as HTMLElement;
  });

let rolesFail = false;
let permissionsFail = false;
const serverError = () => new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại");

beforeEach(() => {
  resetMockApi();
  rolesFail = false;
  permissionsFail = false;
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/system-roles") {
      if (rolesFail) throw serverError();
      return envelope({ roles: [TEACHER, CUSTOM] });
    }
    if (url === "/permissions") {
      if (permissionsFail) throw serverError();
      return envelope({ permissions: [PERMISSION], total: 1 });
    }
    if (/^\/system-roles\/[^/]+\/users$/.test(url)) {
      return envelope({ user_system_roles: [], total: 0, page: 1, page_size: 100 });
    }
    if (/^\/system-roles\/[^/]+\/permissions$/.test(url)) return envelope([]);
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
  useAuthStore.getState().setSessionStatus("authenticated");
  useAuthStore.getState().setPermissions(["ROLES_MANAGE_SYSTEM"]);
});

describe("/admin/roles — QA9-ADMIN-01: GET lỗi không được trông như dữ liệu rỗng", () => {
  it("GET /system-roles lỗi: hiện 'Không thể tải dữ liệu' + 'Thử lại', bấm thử lại thì danh sách về", async () => {
    rolesFail = true;
    renderWithProviders(<RolesPage />);

    const alert = await findQueryErrorBox();
    expect(alert.textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText("Tạo vai trò mới")).not.toBeNull();

    rolesFail = false;
    fireEvent.click(within(alert).getByRole("button", { name: "Thử lại" }));

    await screen.findByText("Vai trò tự tạo");
    await waitFor(() => expect(screen.queryByText("Không thể tải dữ liệu")).toBeNull());
  });

  it("GET /permissions lỗi: ô chọn quyền hiện lỗi + 'Thử lại', bấm thử lại thì quyền hiện ra", async () => {
    permissionsFail = true;
    renderWithProviders(<RolesPage />);

    await screen.findByText("Vai trò tự tạo");
    const alert = await findQueryErrorBox();
    expect(alert.textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText("COURSES_CREATE")).toBeNull();

    permissionsFail = false;
    fireEvent.click(within(alert).getByRole("button", { name: "Thử lại" }));
    await screen.findByText("COURSES_CREATE");
    expect(screen.queryByText("Không thể tải dữ liệu")).toBeNull();
  });

  it("GET thành công thì không có hộp lỗi nào", async () => {
    renderWithProviders(<RolesPage />);
    await screen.findByText("Vai trò tự tạo");
    expect(screen.queryByText("Không thể tải dữ liệu")).toBeNull();
  });
});

describe("/admin/roles — QA9-ADMIN-04: nút trên thẻ có tên theo vai trò", () => {
  it("mỗi thẻ có 'Sửa vai trò <tên>' và 'Xoá vai trò <tên>' riêng, không trùng nhau", async () => {
    renderWithProviders(<RolesPage />);
    await screen.findByText("Vai trò tự tạo");

    for (const name of [TEACHER.name, CUSTOM.name]) {
      expect(screen.getByRole("button", { name: `Sửa vai trò ${name}` })).toBeTruthy();
      expect(screen.getByRole("button", { name: `Xoá vai trò ${name}` })).toBeTruthy();
    }
    expect(screen.queryByRole("button", { name: "Sửa vai trò" })).toBeNull();
  });
});
