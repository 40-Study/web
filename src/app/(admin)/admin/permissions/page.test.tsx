/**
 * A-P1-3 + A-P2-3 regression — trang /admin/permissions trước đây có nút "Tạo"/"Xóa" chỉ
 * setState cục bộ (không gọi API nào — backend không có POST/DELETE /permissions), và mô tả
 * đầu trang nói "CRUD chi tiết: tạo, xem, sửa, xóa" dù Tạo/Xóa không hoạt động thật.
 *
 * Test ĐỎ nếu nút "Tạo"/"Xóa" xuất hiện trở lại, hoặc nếu "Sửa mô tả" không gọi PUT thật.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import AdminPermissionsPage from "./page";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const PERMISSION = { id: "perm-1", name: "COURSES_CREATE", description: "Mô tả cũ", category: "Khoá học" };

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/permissions") return envelope({ permissions: [PERMISSION], total: 1 });
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
  mockApi.put.mockImplementation(async (url: string, data: unknown) => {
    if (url === `/permissions/${PERMISSION.id}`) return envelope({ ...PERMISSION, ...(data as object) });
    throw new Error(`PUT không mong đợi trong test: ${url}`);
  });
  useAuthStore.getState().setSessionStatus("authenticated");
  useAuthStore.getState().setPermissions(["ROLES_MANAGE_SYSTEM"]);
});

describe("/admin/permissions — A-P1-3/A-P2-3", () => {
  it("KHÔNG hiện nút Tạo/Xóa quyền (backend chưa có POST/DELETE)", async () => {
    renderWithProviders(<AdminPermissionsPage />);

    await screen.findByText(PERMISSION.name);

    expect(screen.queryByRole("button", { name: /^tạo$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^xóa$/i })).toBeNull();
    // Mô tả đầu trang không còn nói "tạo... xóa" như bug cũ
    expect(screen.queryByText(/tạo, xem, sửa, xóa/i)).toBeNull();
  });

  it("Sửa mô tả gọi PUT /permissions/:id thật, không chỉ setState cục bộ", async () => {
    renderWithProviders(<AdminPermissionsPage />);

    await screen.findByText(PERMISSION.name);
    fireEvent.click(screen.getByRole("button", { name: "Sửa mô tả" }));

    const textarea = screen.getByPlaceholderText("Mô tả");
    fireEvent.change(textarea, { target: { value: "Mô tả mới" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith(
        `/permissions/${PERMISSION.id}`,
        expect.objectContaining({ description: "Mô tả mới" })
      );
    });
  });
});
