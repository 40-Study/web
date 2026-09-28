import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { bootstrapAuthSession } from "@/components/providers/auth-session";
import { authService, type UnifiedRole, type UserResponseDto } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useSelectRole } from "./use-auth";

vi.mock("@/services/auth.service", () => ({
  authService: {
    selectRole: vi.fn(),
    getMe: vi.fn(),
    getMyRoles: vi.fn(),
    getMyPermissions: vi.fn(),
  },
}));

const teacherUser: UserResponseDto = {
  id: "teacher-1",
  username: "teacher1",
  email: "teacher1@demo.com",
  full_name: "Giáo viên Một",
  is_active: true,
  created_at: "2026-09-01T00:00:00Z",
};

const teacherRole: UnifiedRole = {
  id: "system-role-teacher",
  type: "system",
  role_name: "TEACHER",
  display_name: "Giáo viên",
};

const studentRole: UnifiedRole = {
  id: "system-role-student",
  type: "system",
  role_name: "STUDENT",
  display_name: "Học viên",
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/**
 * Luồng thật của tài khoản nhiều vai trò: /auth/login trả session_token + roles, KHÔNG có `user`
 * (backend chỉ trả `user` khi Completed=true) -> trang /login/role gọi select-role -> tải lại
 * trang. Trước bản sửa, `user` ở lại null trong "auth-storage" và lần bootstrap thụ động khi tải
 * lại trang coi người dùng là khách -> bị đá về /login (lỗi P1 260928).
 */
describe("useSelectRole — tài khoản nhiều vai trò giữ được phiên sau khi tải lại trang", () => {
  beforeEach(() => {
    vi.mocked(authService.selectRole).mockReset();
    vi.mocked(authService.getMe).mockReset();
    vi.mocked(authService.getMyRoles).mockReset();
    vi.mocked(authService.getMyPermissions).mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
    useAuthStore.getState().clearServerSession();
    useAuthStore.setState({ hasHydrated: true });
  });

  it("lưu user sau select-role và bootstrap lúc tải lại trang vẫn authenticated", async () => {
    // Trạng thái sau /auth/login nhiều vai trò: chỉ có session_token + roles, user = null.
    useAuthStore.getState().setSessionToken("multi-role-session-token");
    useAuthStore.getState().setRoles([teacherRole, studentRole]);
    expect(useAuthStore.getState().user).toBeNull();

    vi.mocked(authService.selectRole).mockResolvedValue({
      message: "ok",
      data: {
        completed: true,
        access_token: "access",
        refresh_token: "refresh",
        user: teacherUser,
        active_role: teacherRole,
      },
    } as never);
    vi.mocked(authService.getMe).mockResolvedValue(teacherUser);
    vi.mocked(authService.getMyRoles).mockResolvedValue({ roles: [teacherRole, studentRole] });
    vi.mocked(authService.getMyPermissions).mockResolvedValue([]);

    const { result } = renderHook(() => useSelectRole(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ roleId: teacherRole.id, roleType: "system" });
    });
    await waitFor(() => expect(useAuthStore.getState().sessionStatus).toBe("authenticated"));

    const persisted = JSON.parse(window.localStorage.getItem("auth-storage") ?? "{}");
    expect(persisted.state.user).toMatchObject({ id: teacherUser.id, email: teacherUser.email });

    // Mô phỏng tải lại trang: bootstrap thụ động (không force) như AuthBootstrap lúc mount.
    vi.mocked(authService.getMe).mockClear();
    useAuthStore.setState({ sessionStatus: "checking", isAuthenticated: false });
    await expect(bootstrapAuthSession()).resolves.toBe("authenticated");
    expect(authService.getMe).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({ activeRole: "TEACHER", isAuthenticated: true });
  });
});
