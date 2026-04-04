/**
 * React Query hooks for authentication
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import type { UnifiedRole } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { getRoleFromToken } from "@/lib/jwt";
import { getRoleHomeRoute, normalizeRole } from "@/lib/routes";
import type { Permission } from "@/lib/permissions";

// ═══════════════════════════════════════════════════════════════════════════
// Query Keys
// ═══════════════════════════════════════════════════════════════════════════

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
  publicProfile: (userId: string) => [...authKeys.all, "public-profile", userId] as const,
  devices: () => [...authKeys.all, "devices"] as const,
  organizations: () => [...authKeys.all, "organizations"] as const,
  children: () => [...authKeys.all, "children"] as const,
};

// ═══════════════════════════════════════════════════════════════════════════
// Queries
// ═══════════════════════════════════════════════════════════════════════════

/** Get current user info */
export function useMe() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authService.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/** Get full profile (user + roles + orgs + active context) */
export function useMyProfile() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: authService.getMyProfile,
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

/** Update profile */
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

/** Get user's devices */
export function useDevices() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authKeys.devices(),
    queryFn: authService.getDevices,
    enabled: isAuthenticated,
  });
}

/** Get user's organizations */
export function useMyOrganizations() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authKeys.organizations(),
    queryFn: authService.getMyOrganizations,
    enabled: isAuthenticated,
  });
}

/** Get children (parent role) */
export function useChildren() {
  const { isAuthenticated, activeRole } = useAuthStore();

  return useQuery({
    queryKey: authKeys.children(),
    queryFn: authService.getChildren,
    enabled: isAuthenticated && normalizeRole(activeRole) === "PARENT",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Mutations
// ═══════════════════════════════════════════════════════════════════════════

/** Login mutation - stores auth state, does NOT navigate (callers handle navigation) */
export function useLogin() {
  const { login, setRoles, setSessionToken, setOrganizations, setToken, setActiveRole } = useAuthStore();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async (response) => {
      const data = response.data;

      // Store roles for role selection screen
      if (data.roles) {
        setRoles(data.roles);
      }

      // Store user info (user may not be present when completed=false)
      if (data.user) {
        const user = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.full_name || data.user.name || data.user.username || data.user.email,
          avatar: data.user.avatar_url || data.user.avatar,
        };
        login(user, data.roles || []);
      }

      // Multi-role: has session_token + roles but no access_token → need role selection
      const needsRoleSelection = !data.access_token && data.session_token && (data.roles?.length ?? 0) > 1;

      if (needsRoleSelection) {
        setSessionToken(data.session_token || null);
        if (data.organizations) {
          setOrganizations(data.organizations);
        }
      } else if (data.access_token) {
        // Auto-login: backend returned tokens directly
        setToken(data.access_token);
        setSessionToken(null);
        const role = data.active_role?.role_name || getRoleFromToken(data.access_token);
        setActiveRole(normalizeRole(role));
      }
    },
    onError: (error: unknown) => {
      console.error("Login error:", error);
      toast.error("Đăng nhập thất bại", { description: "Email hoặc mật khẩu không đúng" });
    },
  });
}

/** Register request (OTP) - does NOT navigate */
export function useRegisterRequest() {
  return useMutation({
    mutationFn: authService.registerRequest,
    onSuccess: () => {
      toast.success("Mã OTP đã được gửi");
    },
  });
}

/** Complete registration - does NOT navigate */
export function useRegister() {
  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      toast.success("Đăng ký thành công!");
    },
  });
}

/** Select role during login flow (uses session_token) */
export function useSelectRole() {
  const { setToken, setSessionToken, setActiveRole, setOrganizations, setPermissions, sessionToken } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (role: UnifiedRole) => {
      if (!sessionToken) throw new Error("No session token");
      return authService.selectRole({
        session_token: sessionToken,
        role_id: role.id,
        role_type: role.type,
      });
    },
    onSuccess: (response) => {
      const data = response.data;
      setActiveRole(normalizeRole(data.active_role.role_name));

      if (data.completed && data.access_token) {
        // Role selection completed login → store tokens
        setToken(data.access_token);
        setSessionToken(null);
        qc.invalidateQueries({ queryKey: authKeys.all });
      } else if (data.requires_org_selection && data.organizations) {
        // Need org selection next
        setOrganizations(data.organizations);
        setSessionToken(data.session_token || null);
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

/** Select organization */
export function useSelectOrg() {
  const { setToken, setPermissions, setSessionToken, activeRole } = useAuthStore();
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authService.selectOrg,
    onSuccess: async (response) => {
      try {
        const accessToken = response.data.access_token;
        setToken(accessToken);
        setSessionToken(null);
        // Fetch permissions after getting token
        const me = await authService.getMe();
        setPermissions(me.permissions as Permission[]);
        qc.invalidateQueries({ queryKey: authKeys.all });
        router.push(getRoleHomeRoute(activeRole));
      } catch (error: unknown) {
        console.error("Failed to get user info:", error);
        toast.error("Lỗi lấy thông tin người dùng");
      }
    },
    onError: (error: unknown) => {
      console.error("Select org error:", error);
      toast.error("Chọn tổ chức thất bại", {
        description: "Vui lòng thử lại",
      });
    },
  });
}

/** Logout */
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

/**
 * Logout specific device
 * @deprecated Backend does not support per-device logout yet
 */
export function useLogoutDevice() {
  return useMutation({
    mutationFn: async (_deviceId: string) => {
      throw new Error("Per-device logout not supported by backend");
    },
    onError: () => {
      toast.info("Tính năng đăng xuất từng thiết bị chưa được hỗ trợ");
    },
  });
}

/** Logout all devices */
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

/** Reset password request */
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

/** Reset password */
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

/** Change password */
export function useChangePassword() {
  return useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công");
    },
  });
}
