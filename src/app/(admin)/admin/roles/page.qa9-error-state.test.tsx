/**
 * QA9-ADMIN-01: GET /system-roles lỗi (500) thì cột trái trống trơn, không có thông báo, không có "Thử lại" — trông như
 * "chưa có vai trò nào"; ô chọn quyền của "Tạo vai trò mới" cũng trống im lặng khi GET /permissions lỗi.
 * QA9-ADMIN-04: nút "Sửa vai trò" / "Xoá vai trò" trên các thẻ phải có tên riêng theo vai trò.
 */
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
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
import { adminKeys } from "@/hooks/queries/use-admin";
import { getSystemRoleLabel } from "@/lib/role-labels";

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

    // jsdom không dàn trang: ô cuộn `max-h-32` (128px) cao hơn hộp lỗi thì 'Thử lại' nằm dưới đáy ô, phải cuộn mới thấy
    // (đo ở Chromium: nút cách đỉnh 140px trong ô 128px). Nên khoá cấu trúc: nút không được nằm trong ô cuộn nào.
    const retry = within(alert).getByRole("button", { name: "Thử lại" });
    expect(retry.closest(".overflow-auto")).toBeNull();
    expect(retry.closest(".max-h-32")).toBeNull();

    permissionsFail = false;
    fireEvent.click(retry);
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
  it("mỗi thẻ có 'Sửa vai trò <nhãn hiển thị>' và 'Xoá vai trò <nhãn hiển thị>' riêng, không trùng nhau", async () => {
    renderWithProviders(<RolesPage />);
    await screen.findByText("Vai trò tự tạo");

    // Nhãn đọc ra cho người dùng là nhãn tiếng Việt trên tiêu đề thẻ ("Giảng viên"), không phải mã TEACHER.
    const labels = [getSystemRoleLabel(TEACHER.name), getSystemRoleLabel(CUSTOM.name)];
    expect(labels).toEqual(["Giảng viên", "QA_REVIEWER"]);
    for (const label of labels) {
      expect(screen.getByRole("button", { name: `Sửa vai trò ${label}` })).toBeTruthy();
      expect(screen.getByRole("button", { name: `Xoá vai trò ${label}` })).toBeTruthy();
    }
    expect(screen.queryByRole("button", { name: "Sửa vai trò TEACHER" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Sửa vai trò" })).toBeNull();
  });
});

describe("/admin/roles — QA9-ADMIN-01: lỗi refetch khi đã có danh sách thì giữ danh sách", () => {
  it("tải được rồi refetch GET /system-roles lỗi: vẫn liệt kê vai trò, không hiện hộp lỗi của danh sách", async () => {
    const { queryClient } = renderWithProviders(<RolesPage />);
    await screen.findByText("Vai trò tự tạo");

    rolesFail = true;
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.systemRoles() });
    });
    // react-query giữ `data` cũ khi refetch lỗi, nhưng `isError` bật: trang không được vì thế mà bỏ danh sách.
    await waitFor(() => expect(queryClient.getQueryState(adminKeys.systemRoles())?.status).toBe("error"));

    expect(screen.getByText("Vai trò tự tạo")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sửa vai trò Giảng viên" })).toBeTruthy();
    expect(screen.queryByText("Không thể tải dữ liệu")).toBeNull();
  });
});
