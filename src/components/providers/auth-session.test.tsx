import { render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthError } from "@/lib/errors";
import { PERMISSIONS } from "@/lib/permissions";
import { authService, type UnifiedRole, type UserResponseDto } from "@/services/auth.service";
import { ROLE_SELECTION_TOKEN_KEY, useAuthStore } from "@/stores/auth.store";
import { Can } from "@/components/guards/can";
import { RoleGuard } from "@/components/guards/role-guard";
import { bootstrapAuthSession } from "./auth-session";

vi.mock("@/services/auth.service", () => ({
  authService: {
    getMe: vi.fn(),
    getMyRoles: vi.fn(),
    getMyPermissions: vi.fn(),
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
    vi.mocked(authService.getMyPermissions).mockReset();
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
    vi.mocked(authService.getMyPermissions).mockResolvedValue([
      PERMISSIONS.MANAGE_USERS,
      "future_backend_permission",
    ]);

    await expect(bootstrapAuthSession()).resolves.toBe("authenticated");

    expect(authService.getMyPermissions).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      sessionStatus: "authenticated",
      isAuthenticated: true,
      activeUnifiedRole: systemRole,
      activeRole: "SYSTEM_ADMIN",
      permissions: [PERMISSIONS.MANAGE_USERS],
    });
  });

  it("loads permissions for an organization role from the caller-scoped endpoint", async () => {
    useAuthStore.setState({
      activeRole: "TEACHER",
      activeUnifiedRole: organizationRole,
    });
    vi.mocked(authService.getMe).mockResolvedValue(user);
    vi.mocked(authService.getMyRoles).mockResolvedValue({ roles: [organizationRole] });
    vi.mocked(authService.getMyPermissions).mockResolvedValue([PERMISSIONS.MANAGE_OWN_CLASSES]);

    await bootstrapAuthSession();

    expect(authService.getMyPermissions).toHaveBeenCalledTimes(1);
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

  // Lỗi 2 (fullstack-verify-260922): học viên/giảng viên nhận 403 khi nạp quyền; bootstrap từng
  // xoá cả phiên đã xác thực, đẩy người dùng về trang chọn vai trò ngay sau khi đăng nhập.
  it("keeps the verified session and role when loading permissions fails", async () => {
    const studentRole: UnifiedRole = { id: "system-role-student", type: "system", role_name: "STUDENT", display_name: "Học viên" };
    useAuthStore.setState({ activeRole: "STUDENT", activeUnifiedRole: studentRole });
    vi.mocked(authService.getMe).mockResolvedValue(user);
    vi.mocked(authService.getMyRoles).mockResolvedValue({ roles: [studentRole] });
    vi.mocked(authService.getMyPermissions).mockRejectedValue(new Error("Request failed with status code 403"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(bootstrapAuthSession()).resolves.toBe("authenticated");

    expect(useAuthStore.getState()).toMatchObject({
      sessionStatus: "authenticated",
      isAuthenticated: true,
      activeRole: "STUDENT",
      activeUnifiedRole: studentRole,
      permissions: [],
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
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

  // Review đối kháng (plans/reports/review-260928-users-pr72-pr28.md, finding #5 MAJOR): phải
  // phân biệt "bị khoá" bằng error.code === "ACCOUNT_LOCKED", KHÔNG so nguyên văn message tiếng
  // Việt — test này dùng error.code thật (không phải error.message) để xác nhận toast đúng.
  it("shows the ACCOUNT_LOCKED toast and clears session when getMe fails with that code", async () => {
    useAuthStore.setState({
      activeRole: "STUDENT",
      activeUnifiedRole: { id: "system-role-student", type: "system", role_name: "STUDENT", display_name: "Học viên" },
    });
    vi.mocked(authService.getMe).mockRejectedValue(new AuthError("Tài khoản đã bị khoá", "ACCOUNT_LOCKED"));
    const toastError = vi.spyOn(toast, "error").mockImplementation(() => "" as never);

    await expect(bootstrapAuthSession()).resolves.toBe("anonymous");

    expect(toastError).toHaveBeenCalledWith(
      "Tài khoản đã bị khoá",
      expect.objectContaining({ description: expect.any(String) })
    );
    expect(useAuthStore.getState()).toMatchObject({
      sessionStatus: "anonymous",
      isAuthenticated: false,
      activeRole: null,
    });
    toastError.mockRestore();
  });

  it("does NOT show the ACCOUNT_LOCKED toast for a generic 401 (different code)", async () => {
    vi.mocked(authService.getMe).mockRejectedValue(new AuthError("Invalid or expired token", "AUTH_ERROR"));
    const toastError = vi.spyOn(toast, "error").mockImplementation(() => "" as never);

    await expect(bootstrapAuthSession()).resolves.toBe("anonymous");

    expect(toastError).not.toHaveBeenCalled();
    toastError.mockRestore();
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
