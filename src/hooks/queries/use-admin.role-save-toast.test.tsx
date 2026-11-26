/**
 * QA8-A13: tạo vai trò trùng tên hiện lời báo ở ô tên (trang) VÀ một toast khác lời (toast mặc định của app) cùng lúc.
 * Giờ lỗi "tên đã tồn tại" chỉ do ô tên báo; lỗi khác vẫn nhận toast mặc định.
 */
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() } }));
const createSystemRole = vi.fn();
const updateSystemRole = vi.fn();
vi.mock("@/services/role.service", () => ({
  roleService: {
    createSystemRole: (...a: unknown[]) => createSystemRole(...a),
    updateSystemRole: (...a: unknown[]) => updateSystemRole(...a),
  },
}));

import { createAppQueryClient } from "@/lib/query-client";
import { ApiError } from "@/lib/errors";
import { useCreateSystemRole, useUpdateSystemRole } from "./use-admin";

function wrapper() {
  const client = createAppQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

beforeEach(() => {
  toastError.mockReset();
  createSystemRole.mockReset();
  updateSystemRole.mockReset();
});

describe("useCreateSystemRole / useUpdateSystemRole — QA8-A13", () => {
  it.each([
    ["409 ERR_ROLE_NAME_EXISTS", new ApiError(409, "ERR_ROLE_NAME_EXISTS", "Tên vai trò đã tồn tại")],
    ["400 duplicated key (backend cũ)", new ApiError(400, "UNKNOWN", "duplicated key not allowed")],
  ])("tạo: %s -> không toast (ô tên đã báo)", async (_n, error) => {
    createSystemRole.mockRejectedValue(error);
    const { result } = renderHook(() => useCreateSystemRole(), { wrapper: wrapper() });
    result.current.mutate({ name: "STUDENT" } as never);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toastError).not.toHaveBeenCalled();
  });

  it("sửa: trùng tên -> không toast", async () => {
    updateSystemRole.mockRejectedValue(new ApiError(409, "ERR_ROLE_NAME_EXISTS", "x"));
    const { result } = renderHook(() => useUpdateSystemRole(), { wrapper: wrapper() });
    result.current.mutate({ roleId: "r1", data: { name: "STUDENT" } } as never);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toastError).not.toHaveBeenCalled();
  });

  it("lỗi khác (500) vẫn nhận toast mặc định", async () => {
    createSystemRole.mockRejectedValue(new ApiError(500, "UNKNOWN", "boom"));
    const { result } = renderHook(() => useCreateSystemRole(), { wrapper: wrapper() });
    result.current.mutate({ name: "X1" } as never);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toastError).toHaveBeenCalledTimes(1);
  });
});
