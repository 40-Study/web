/**
 * React Query hooks for authentication
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
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
    enabled: isAuthenticated && activeRole === "parent",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Mutations
// ═══════════════════════════════════════════════════════════════════════════

/** Login mutation */
export function useLogin() {
  const { login, logout, setSystemRoles, setSessionToken, setOrganizations } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async (response) => {
      const { session_token, system_roles, user } = response.data;

      login(user, system_roles);
      setSessionToken(session_token);
      setSystemRoles(system_roles);

      // Navigate based on roles
      if (system_roles.length > 1) {
        router.push("/login/role");
        return;
      }

      if (system_roles.length === 1) {
        try {
          const selectResponse = await authService.selectProfile({
            session_token: session_token,
            system_role_id: system_roles[0].id,
          });
          setOrganizations(selectResponse.data.organizations);
          router.push("/login/organization");
        } catch (error: unknown) {
          console.error("Select profile failed:", error);
          toast.error("Đăng nhập thất bại", {
            description: "Không thể chọn vai trò. Vui lòng thử lại.",
          });
          logout();
        }
      }
    },
    onError: (error: unknown) => {
      console.error("Login error:", error);
      toast.error("Đăng nhập thất bại", { description: "Email hoặc mật khẩu không đúng" });
    },
  });
}

/** Register request (OTP) */
export function useRegisterRequest() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.registerRequest,
    onSuccess: () => {
      toast.success("Mã OTP đã được gửi");
      router.push("/otp");
    },
  });
}

/** Complete registration */
export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      toast.success("Đăng ký thành công!");
      router.push("/register/success");
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
  const { setToken, setPermissions, setSessionToken } = useAuthStore();
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
        router.push("/dashboard");
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
      router.push("/login");
    },
    onError: () => {
      // Force logout on error too
      logout();
      qc.clear();
      router.push("/login");
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
      router.push("/login");
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
