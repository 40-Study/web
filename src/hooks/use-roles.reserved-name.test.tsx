/** Backend #146: tạo/đổi tên vai trùng tên vai hệ thống trả 400 ROLE_NAME_RESERVED; toast không được in câu tiếng Anh. */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() } }));

vi.mock("@/services/role.service", () => ({
  roleService: { createOrgRole: vi.fn(), updateOrgRole: vi.fn() },
}));

import { ApiError } from "@/lib/errors";
import { roleService } from "@/services/role.service";
import { useCreateRole, useUpdateRole } from "./use-roles";

const RESERVED = new ApiError(400, "ROLE_NAME_RESERVED", "role name is reserved");
const MESSAGE = "Tên vai này trùng tên vai hệ thống, hãy chọn tên khác.";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  toastError.mockReset();
  vi.mocked(roleService.createOrgRole).mockRejectedValue(RESERVED);
  vi.mocked(roleService.updateOrgRole).mockRejectedValue(RESERVED);
});

describe("ROLE_NAME_RESERVED", () => {
  it("tạo vai: toast có câu tiếng Việt", async () => {
    const { result } = renderHook(() => useCreateRole("org-1"), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ name: "TEACHER", organization_id: "org-1" } as never).catch(() => undefined);
    });
    expect(toastError.mock.calls[0][1]).toEqual({ description: MESSAGE });
  });

  it("đổi tên vai: toast có câu tiếng Việt", async () => {
    const { result } = renderHook(() => useUpdateRole("org-1"), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: "r1", data: { name: "TEACHER" } as never }).catch(() => undefined);
    });
    expect(toastError.mock.calls[0][1]).toEqual({ description: MESSAGE });
  });
});
