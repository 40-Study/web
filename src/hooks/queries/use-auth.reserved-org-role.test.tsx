/** Backend #146: chọn/đổi sang vai tổ chức trùng tên vai hệ thống trả 400 ORG_ROLE_NAME_RESERVED; phải nói rõ lý do. */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() } }));

vi.mock("@/services/auth.service", () => ({
  authService: { selectRole: vi.fn(), switchRole: vi.fn(), getMe: vi.fn(), getMyRoles: vi.fn(), getMyPermissions: vi.fn() },
}));

import { ApiError } from "@/lib/errors";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useSelectRole, useSwitchRole } from "./use-auth";

const RESERVED = new ApiError(
  400,
  "ORG_ROLE_NAME_RESERVED",
  "organization role name collides with a system role name; ask the organization owner to rename it"
);
const MESSAGE = "Vai này có tên trùng vai hệ thống nên không dùng được. Hãy liên hệ chủ tổ chức.";
const SWITCH_INPUT = { role_id: "r1", role_type: "organization" as const, organization_id: "org-1" };

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  toastError.mockReset();
  vi.mocked(authService.selectRole).mockReset();
  vi.mocked(authService.switchRole).mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  useAuthStore.getState().setSessionToken("session-token");
});

describe("ORG_ROLE_NAME_RESERVED", () => {
  it("switch-role: toast nói rõ lý do, không phải 'Đổi vai trò thất bại'", async () => {
    vi.mocked(authService.switchRole).mockRejectedValue(RESERVED);
    const { result } = renderHook(() => useSwitchRole(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(SWITCH_INPUT).catch(() => undefined);
    });
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError.mock.calls[0][0]).toBe(MESSAGE);
  });

  it("select-role: toast nói rõ lý do, không phải 'Chọn vai trò thất bại'", async () => {
    vi.mocked(authService.selectRole).mockRejectedValue(RESERVED);
    const { result } = renderHook(() => useSelectRole(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ roleId: "r1", roleType: "organization", organizationId: "org-1" }).catch(() => undefined);
    });
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError.mock.calls[0][0]).toBe(MESSAGE);
  });

  it("lỗi khác của switch-role vẫn giữ câu chung", async () => {
    vi.mocked(authService.switchRole).mockRejectedValue(new ApiError(400, "UNKNOWN", "bad request"));
    const { result } = renderHook(() => useSwitchRole(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(SWITCH_INPUT).catch(() => undefined);
    });
    expect(toastError.mock.calls[0][0]).toBe("Đổi vai trò thất bại");
  });
});
