/** QA3-19: làm mới /login/role mất session_token → báo rõ và về /login, không "Chọn vai trò thất bại". */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() } }));

vi.mock("@/services/auth.service", () => ({
  authService: { selectRole: vi.fn(), getMe: vi.fn(), getMyRoles: vi.fn(), getMyPermissions: vi.fn() },
}));

import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useSelectRole } from "./use-auth";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useSelectRole — mất session_token", () => {
  beforeEach(() => {
    replace.mockReset();
    toastError.mockReset();
    vi.mocked(authService.selectRole).mockReset();
    window.sessionStorage.clear();
    useAuthStore.getState().clearServerSession();
    useAuthStore.setState({ hasHydrated: true });
  });

  it("không có token ở store lẫn sessionStorage: thông báo hết phiên bằng tiếng Việt và chuyển về /login", async () => {
    const { result } = renderHook(() => useSelectRole(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ roleId: "r1", roleType: "system" }).catch(() => undefined);
    });

    expect(authService.selectRole).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/login");
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError.mock.calls[0][0]).toBe("Phiên đăng nhập đã hết hạn");
    expect(toastError.mock.calls[0][0]).not.toMatch(/thất bại/);
  });

  it("store mất token nhưng sessionStorage còn: dùng lại token đó, không đá người dùng ra", async () => {
    useAuthStore.getState().setSessionToken("still-in-session-storage");
    useAuthStore.setState({ sessionToken: null }); // mô phỏng store dựng lại sau F5
    vi.mocked(authService.selectRole).mockResolvedValue({ message: "ok", data: { completed: false } } as never);

    const { result } = renderHook(() => useSelectRole(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ roleId: "r1", roleType: "system" });
    });

    expect(authService.selectRole).toHaveBeenCalledWith(expect.objectContaining({ session_token: "still-in-session-storage" }));
    expect(replace).not.toHaveBeenCalled();
  });
});
