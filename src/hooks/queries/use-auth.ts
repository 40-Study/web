/**
 * React Query hooks for authentication
 * Aligned with backend: /auth/login, /auth/select-role, /auth/switch-role, etc.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { getRoleFromToken } from "@/lib/jwt";
import { getRoleHomeRoute, normalizeRole } from "@/lib/routes";

// ═══════════════════════════════════════════════════════════════════════════
// Query Keys
// ═══════════════════════════════════════════════════════════════════════════

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
  publicProfile: (userId: string) => [...authKeys.all, "public-profile", userId] as const,
  devices: () => [...authKeys.all, "devices"] as const,
  myRoles: () => [...authKeys.all, "my-roles"] as const,
  profiles: () => [...authKeys.all, "profiles"] as const,
  organizations: () => [...authKeys.all, "organizations"] as const,
  children: () => [...authKeys.all, "children"] as const,
  linkedAccounts: () => [...authKeys.all, "linked-accounts"] as const,
};

// ═══════════════════════════════════════════════════════════════════════════
// Queries
// ═══════════════════════════════════════════════════════════════════════════

/** GET /auth/me - Get current user info */
export function useMe() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authService.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/** GET /auth/me/profiles - Get user's profiles */
export function useMyProfiles() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authKeys.profiles(),
    queryFn: authService.getMyProfiles,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/** Get public profile */
export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: authKeys.publicProfile(userId),
    queryFn: () => authService.getPublicProfile(userId),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });
}

/** PUT /auth/me - Update profile */
export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me() });
      qc.invalidateQueries({ queryKey: authKeys.profile() });
      toast.success("Cập nhật thành công");
    },
    onError: () => {
      toast.error("Cập nhật thất bại");
    },
  });
}

/** GET /auth/devices - Get user's devices */
export function useDevices() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authKeys.devices(),
    queryFn: authService.getDevices,
    enabled: isAuthenticated,
  });
}

/** GET /auth/my-roles - Get unified roles (requires auth) */
export function useMyRoles() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authKeys.myRoles(),
    queryFn: authService.getMyRoles,
    enabled: isAuthenticated,
  });
}

/** GET children (parent role) */
export function useChildren() {
  const { isAuthenticated, activeRole } = useAuthStore();

  return useQuery({
    queryKey: authKeys.children(),
    queryFn: () => authService.getChildren(),
    enabled: isAuthenticated && normalizeRole(activeRole) === "PARENT",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Mutations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /auth/login
 * Handles all login cases and stores auth state.
 * Does NOT navigate — callers handle navigation.
 */
export function useLogin() {
  const { login, setRoles, setSessionToken, setToken, setActiveRole, setActiveUnifiedRole } =
    useAuthStore();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async (response) => {
      const data = response.data;

      // Store user info if present
      if (data.user) {
        login(
          {
            id: data.user.id || "",
            email: data.user.email || "",
            name: data.user.full_name || data.user.username || data.user.email || "",
            avatar: data.user.avatar_url,
          },
          data.roles || []
        );
      }

      // Case 0: User chưa có role → cần chọn role để đăng ký
      if (data.needs_role_registration && data.session_token) {
        setSessionToken(data.session_token);
        setRoles([]);
        return;
      }

      // Case 1: Direct login (1 role, có access_token) → hoàn tất
      if (data.access_token && !data.session_token) {
        setToken(data.access_token);
        setSessionToken(null);
        if (data.active_role) {
          setActiveRole(normalizeRole(data.active_role.role_name));
          setActiveUnifiedRole(data.active_role);
        } else {
          setActiveRole(normalizeRole(getRoleFromToken(data.access_token)));
        }
        return;
      }

      // Case 2: Multi-role → lưu session_token + roles để chọn
      if (data.session_token) {
        setSessionToken(data.session_token);
      }
      if (data.roles && data.roles.length > 0) {
        setRoles(data.roles);
      }
    },
    onError: (error: unknown) => {
      console.error("Login error:", error);
      toast.error("Đăng nhập thất bại", { description: "Email hoặc mật khẩu không đúng" });
    },
  });
}

/** POST /auth/register/request - Request OTP */
export function useRegisterRequest() {
  return useMutation({
    mutationFn: authService.registerRequest,
    onSuccess: () => {
      toast.success("Mã OTP đã được gửi");
    },
  });
}

/** POST /auth/register - Complete registration */
export function useRegister() {
  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      toast.success("Đăng ký thành công!");
    },
  });
}

/**
 * POST /auth/select-role - Select role during login flow (uses session_token)
 * Completes login: returns tokens, sets auth state, navigates to home.
 */
export function useSelectRole() {
  const { sessionToken, setToken, setSessionToken, setActiveRole, setActiveUnifiedRole } =
    useAuthStore();
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (params: {
      roleId: string;
      roleType: "system" | "organization";
      organizationId?: string;
    }) => {
      if (!sessionToken) throw new Error("No session token");
      return authService.selectRole({
        session_token: sessionToken,
        role_id: params.roleId,
        role_type: params.roleType,
        organization_id: params.organizationId,
      });
    },
    onSuccess: (response) => {
      const data = response.data;

      if (data.completed && data.access_token) {
        // Login hoàn tất
        setToken(data.access_token);
        setSessionToken(null);
        setActiveRole(normalizeRole(data.active_role.role_name));
        setActiveUnifiedRole(data.active_role);

        qc.invalidateQueries({ queryKey: authKeys.all });

        // Check redirect (e.g., from accept-invitation)
        const redirect = sessionStorage.getItem("auth_redirect");
        if (redirect) {
          sessionStorage.removeItem("auth_redirect");
          router.push(redirect);
        } else {
          router.push(getRoleHomeRoute(normalizeRole(data.active_role.role_name)));
        }
      }
    },
    onError: (error: unknown) => {
      console.error("Select role error:", error);
      toast.error("Chọn vai trò thất bại", {
        description: "Vui lòng thử lại hoặc đăng nhập lại",
      });
    },
  });
}

/**
 * POST /auth/switch-role - Switch role while already logged in
 * Returns new tokens and navigates to the appropriate home page.
 */
export function useSwitchRole() {
  const { setToken, setActiveRole, setActiveUnifiedRole } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: authService.switchRole,
    onSuccess: (response) => {
      const data = response.data;
      if (data.access_token) {
        setToken(data.access_token);
        const newRole = normalizeRole(data.active_role.role_name);
        setActiveRole(newRole);
        setActiveUnifiedRole(data.active_role);
        qc.invalidateQueries({ queryKey: authKeys.all });
        window.location.href = getRoleHomeRoute(newRole);
      }
    },
    onError: (error: unknown) => {
      console.error("Switch role error:", error);
      toast.error("Đổi vai trò thất bại");
    },
  });
}

/** POST /auth/logout - Logout current device */
export function useLogout() {
  const { logout } = useAuthStore();
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      qc.clear();
      router.push("/");
    },
    onError: () => {
      // Force logout on error too
      logout();
      qc.clear();
      router.push("/");
    },
  });
}

/** POST /auth/logout-all - Logout all devices */
export function useLogoutAll() {
  const { logout } = useAuthStore();
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authService.logoutAll,
    onSuccess: () => {
      logout();
      qc.clear();
      toast.success("Đã đăng xuất tất cả thiết bị");
      router.push("/");
    },
  });
}

/** POST /auth/reset-password/request */
export function useResetPasswordRequest() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.resetPasswordRequest,
    onSuccess: () => {
      toast.success("Mã xác nhận đã được gửi");
      router.push("/forgot-password/otp");
    },
  });
}

/** POST /auth/reset-password */
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      toast.success("Đặt lại mật khẩu thành công");
      router.push("/reset-password/success");
    },
  });
}

/** PUT /auth/change-password */
export function useChangePassword() {
  return useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công");
    },
  });
}

/** Get OAuth providers linked to the current user */
export function useLinkedAccounts() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authKeys.linkedAccounts(),
    queryFn: authService.getLinkedAccounts,
    enabled: isAuthenticated,
  });
}

/** Disconnect an OAuth provider from the current user */
export function useDisconnectProvider() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (provider: string) => authService.disconnectProvider(provider),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.linkedAccounts() });
      toast.success("Đã ngắt kết nối tài khoản");
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Không thể ngắt kết nối";
      toast.error(msg);
    },
  });
}

/** Delete (soft) the current account */
export function useDeleteAccount() {
  const authStore = useAuthStore.getState();
  return useMutation({
    mutationFn: (data: { password: string }) => authService.deleteAccount(data),
    onSuccess: () => {
      authStore.logout();
      window.location.href = "/login";
    },
    onError: () => {
      toast.error("Xóa tài khoản thất bại, vui lòng kiểm tra lại mật khẩu");
    },
  });
}
