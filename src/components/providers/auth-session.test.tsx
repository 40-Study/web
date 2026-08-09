import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERMISSIONS } from "@/lib/permissions";
import { authService, type UnifiedRole, type UserResponseDto } from "@/services/auth.service";
import { roleService } from "@/services/role.service";
import { ROLE_SELECTION_TOKEN_KEY, useAuthStore } from "@/stores/auth.store";
import { Can } from "@/components/guards/can";
import { RoleGuard } from "@/components/guards/role-guard";
import { bootstrapAuthSession } from "./auth-session";

vi.mock("@/services/auth.service", () => ({
  authService: {
    getMe: vi.fn(),
    getMyRoles: vi.fn(),
  },
}));

vi.mock("@/services/role.service", () => ({
  roleService: {
    getSystemRolePermissions: vi.fn(),
    getOrgRolePermissions: vi.fn(),
  },
}));

const user: UserResponseDto = {
  id: "user-1",
  username: "an",
  email: "an@example.com",
  full_name: "An",
  is_active: true,
  created_at: "2026-08-09T00:00:00Z",
};

const systemRole: UnifiedRole = {
  id: "system-role-1",
  type: "system",
  role_name: "SYSTEM_ADMIN",
  display_name: "Quản trị hệ thống",
};

const organizationRole: UnifiedRole = {
  id: "org-role-1",
  type: "organization",
  role_name: "TEACHER",
  display_name: "Giáo viên - ForteX",
  organization_id: "org-1",
  organization_name: "ForteX",
};

describe("cookie-backed auth bootstrap", () => {
  beforeEach(() => {
    vi.mocked(authService.getMe).mockReset();
    vi.mocked(authService.getMyRoles).mockReset();
    vi.mocked(roleService.getSystemRolePermissions).mockReset();
    vi.mocked(roleService.getOrgRolePermissions).mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
    useAuthStore.getState().clearServerSession();
    useAuthStore.setState({ hasHydrated: true });
  });

  it("restores a valid system role and hydrates known permission names", async () => {
    useAuthStore.setState({
      activeRole: "SYSTEM_ADMIN",
      activeUnifiedRole: systemRole,
    });
    vi.mocked(authService.getMe).mockResolvedValue(user);
    vi.mocked(authService.getMyRoles).mockResolvedValue({ roles: [systemRole] });
    vi.mocked(roleService.getSystemRolePermissions).mockResolvedValue([
      { id: "permission-1", name: PERMISSIONS.MANAGE_USERS },
      { id: "permission-unknown", name: "future_backend_permission" },
    ]);

    await expect(bootstrapAuthSession()).resolves.toBe("authenticated");

    expect(roleService.getSystemRolePermissions).toHaveBeenCalledWith(systemRole.id);
    expect(roleService.getOrgRolePermissions).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      sessionStatus: "authenticated",
      isAuthenticated: true,
      activeUnifiedRole: systemRole,
      activeRole: "SYSTEM_ADMIN",
      permissions: [PERMISSIONS.MANAGE_USERS],
    });
  });

  it("uses the organization permission endpoint for an organization role", async () => {
    useAuthStore.setState({
      activeRole: "TEACHER",
      activeUnifiedRole: organizationRole,
    });
    vi.mocked(authService.getMe).mockResolvedValue(user);
    vi.mocked(authService.getMyRoles).mockResolvedValue({ roles: [organizationRole] });
    vi.mocked(roleService.getOrgRolePermissions).mockResolvedValue([
      { id: "permission-2", name: PERMISSIONS.MANAGE_OWN_CLASSES },
    ]);

    await bootstrapAuthSession();

    expect(roleService.getOrgRolePermissions).toHaveBeenCalledWith(organizationRole.id);
    expect(roleService.getSystemRolePermissions).not.toHaveBeenCalled();
    expect(useAuthStore.getState().permissions).toEqual([PERMISSIONS.MANAGE_OWN_CLASSES]);
  });

  it("clears a stale active role while keeping the verified session authenticated", async () => {
    useAuthStore.setState({
      activeRole: "SYSTEM_ADMIN",
      activeUnifiedRole: systemRole,
      permissions: [PERMISSIONS.MANAGE_USERS],
    });
    vi.mocked(authService.getMe).mockResolvedValue(user);
    vi.mocked(authService.getMyRoles).mockResolvedValue({ roles: [organizationRole] });

    await bootstrapAuthSession();

    expect(useAuthStore.getState()).toMatchObject({
      sessionStatus: "authenticated",
      activeRole: null,
      activeUnifiedRole: null,
      permissions: [],
    });
  });

  it("becomes anonymous and clears stale authority when server validation fails", async () => {
    useAuthStore.setState({
      activeRole: "SYSTEM_ADMIN",
      activeUnifiedRole: systemRole,
      permissions: [PERMISSIONS.MANAGE_USERS],
    });
    vi.mocked(authService.getMe).mockRejectedValue(new Error("unauthorized"));

    await expect(bootstrapAuthSession()).resolves.toBe("anonymous");

    expect(authService.getMyRoles).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      sessionStatus: "anonymous",
      isAuthenticated: false,
      user: null,
      activeRole: null,
      permissions: [],
    });
  });

  it("keeps the multi-role selection token in sessionStorage only", async () => {
    useAuthStore.getState().setSessionToken("tab-scoped-token");
    useAuthStore.getState().setAuthenticated(true);
    useAuthStore.getState().setPermissions([PERMISSIONS.MANAGE_USERS]);
    await Promise.resolve();

    const persisted = JSON.parse(window.localStorage.getItem("auth-storage") ?? "{}");
    expect(persisted.state).not.toHaveProperty("sessionToken");
    expect(persisted.state).not.toHaveProperty("isAuthenticated");
    expect(persisted.state).not.toHaveProperty("permissions");
    expect(window.sessionStorage.getItem(ROLE_SELECTION_TOKEN_KEY)).toBe("tab-scoped-token");
  });

  it("does not render guarded content while checking and Can uses hydrated permissions", () => {
    useAuthStore.setState({
      sessionStatus: "checking",
      isAuthenticated: false,
      activeRole: "SYSTEM_ADMIN",
      permissions: [PERMISSIONS.MANAGE_USERS],
    });
    const { rerender } = render(
      <>
        <RoleGuard roles={["SYSTEM_ADMIN"]}>
          <span>Nội dung bảo vệ</span>
        </RoleGuard>
        <Can permission={PERMISSIONS.MANAGE_USERS} fallback={<span>Ẩn</span>}>
          <span>Quản lý người dùng</span>
        </Can>
      </>
    );

    expect(screen.queryByText("Nội dung bảo vệ")).toBeNull();
    expect(screen.queryByText("Ẩn")).not.toBeNull();

    useAuthStore.setState({ sessionStatus: "authenticated", isAuthenticated: true });
    rerender(
      <Can permission={PERMISSIONS.MANAGE_USERS}>
        <span>Quản lý người dùng</span>
      </Can>
    );
    expect(screen.queryByText("Quản lý người dùng")).not.toBeNull();
  });
});
