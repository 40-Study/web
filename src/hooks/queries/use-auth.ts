/**
 * React Query hooks for authentication
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
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
    queryKey: [...authKeys.all, "profile"] as const,
    queryFn: authService.getMyProfile,
    enabled: isAuthenticated,
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
      qc.invalidateQueries({ queryKey: [...authKeys.all, "profile"] });
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

/** Login mutation - stores auth state, does NOT navigate (callers handle navigation via modal) */
export function useLogin() {
  const { login, setSystemRoles, setSessionToken, setOrganizations, setToken, setActiveRole } = useAuthStore();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async (response) => {
      const data = response.data;

      // Store user info
      const user = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || data.user.username || data.user.email,
        avatar: data.user.avatar,
      };
      login(user, data.system_roles || []);

      // Case 1: Direct login - backend returns access_token directly (1 role, 0 orgs)
      if (data.access_token && !data.session_token) {
        setToken(data.access_token);
        setSessionToken(null);
        // Extract role from JWT if not in response
        const role = data.active_role?.name || getRoleFromToken(data.access_token);
        setActiveRole(normalizeRole(role));
        return;
      }

      // Case 2: Multi-step login with system_roles
      if (data.system_roles) {
        setSystemRoles(data.system_roles);
      }

      // Case 3: Requires org selection (1 role, has orgs)
      if (data.requires_org_selection) {
        setSessionToken(data.session_token || null);
        setOrganizations(data.organizations || []);
        return;
      }

      // Case 4: Multiple roles → need profile selection
      if (data.session_token) {
        setSessionToken(data.session_token);
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

/** Select profile/role */
export function useSelectProfile() {
  const { setOrganizations, sessionToken } = useAuthStore();

  return useMutation({
    mutationFn: async (roleId: string) => {
      if (!sessionToken) throw new Error("No session token");
      return authService.selectProfile({
        session_token: sessionToken,
        system_role_id: roleId,
      });
    },
    onSuccess: (response) => {
      setOrganizations(response.data.organizations);
    },
    onError: (error: unknown) => {
      console.error("Select profile error:", error);
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
