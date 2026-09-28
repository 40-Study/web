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
import { bootstrapAuthSession } from "@/components/providers/auth-session";
import { AuthError, RateLimitError } from "@/lib/errors";
import { getErrorMessage } from "@/lib/error-messages";
import { sanitizeRedirect } from "@/lib/safe-redirect";

/**
 * Ưu tiên message thật từ backend (ApiError), rơi về fallback khi không có.
 * Rate-limit (429) luôn xử lý riêng bằng message tiếng Việt cố định —
 * `RateLimitError.message` là text tiếng Anh cứng ("Too many requests.")
 * không lấy được `retry_after`/message thật từ backend
 * ("Too many authentication attempts...") vì api-client.ts's interceptor
 * ném `new RateLimitError()` không kèm dữ liệu response. Phát hiện khi test
 * lại OTP sai bị dính chung bucket rate-limit với /register (260927) —
 * nếu không tách riêng, người dùng bị 429 sẽ thấy message tiếng Anh khó hiểu
 * y hệt lỗi thật.
 */
export function authErrorMessage(error: unknown, fallback: string): string {
  // QA vòng 2 (N9): trước đây trả thẳng `error.message` tiếng Anh của backend. Giờ đi qua bảng
  // ánh xạ chung (lib/error-messages.ts); 429 tự kèm số giây chờ (RateLimitError, C5).
  return getErrorMessage(error, fallback);
}

/**
 * Dịch 3 message OTP tiếng Anh CỐ ĐỊNH mà backend trả (xem
 * internal/service/auth_service.go dòng ~281, ~1392, ~1400/1432 — dùng chung
 * cho cả xác thực đăng ký lẫn quên mật khẩu) sang tiếng Việt. Giữ lại số lượt
 * thử còn lại khi có — thông tin hữu ích, không phải chỉ báo lỗi suông. Message
 * không khớp mẫu nào (RateLimitError tiếng Việt, fallback tiếng Việt...) được
 * trả nguyên vẹn. api-client.ts giờ ưu tiên đọc field `error` (chi tiết thật)
 * thay vì `message` (nhãn chung "Register failed") nên chuỗi tiếng Anh này
 * mới lộ ra được — nếu không dịch sẽ vi phạm "UI tiếng Việt nhất quán" (QA
 * khách P1, 260927).
 */
export function translateOtpErrorMessage(message: string): string {
  const attemptsMatch = message.match(/invalid OTP,\s*(\d+)\s*attempts?\s*remaining/i);
  if (attemptsMatch) {
    return `Mã OTP không đúng, còn ${attemptsMatch[1]} lần thử`;
  }
  if (/OTP not found or expired/i.test(message)) {
    return "Mã OTP đã hết hạn, vui lòng bấm \"Gửi lại mã\"";
  }
  if (/invalid OTP data/i.test(message)) {
    return "Mã OTP không hợp lệ, vui lòng thử lại";
  }
  return message;
}

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
  const { login, setRoles, setSessionToken, setActiveRole, setActiveUnifiedRole } = useAuthStore();

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
        setSessionToken(null);
        if (data.active_role) {
          setActiveRole(normalizeRole(data.active_role.role_name));
          setActiveUnifiedRole(data.active_role);
        } else {
          setActiveRole(normalizeRole(getRoleFromToken(data.access_token)));
        }
        await bootstrapAuthSession(true);
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
      // A-P3-1 (verify-260927-student-admin.md): trước đây LUÔN hiện "Email
      // hoặc mật khẩu không đúng" bất kể lỗi thật là gì — bị rate-limit 429
      // (dùng chung bucket với /refresh-token, xem S-P1-2) cũng hiện y hệt
      // sai mật khẩu, khiến người dùng đổi mật khẩu vô ích trong lúc chỉ cần
      // đợi. Phân biệt rõ 429 với lỗi đăng nhập thật.
      if (error instanceof RateLimitError) {
        // C5: kèm số giây chờ thật từ backend (retry_after) khi có.
        toast.error(error.message);
        return;
      }
      // Phase 1 quản lý người dùng (2026-09-28): tài khoản bị khoá phải hiện thông báo RIÊNG,
      // không lẫn với "sai mật khẩu". So bằng `error.code` (ACCOUNT_LOCKED do backend trả,
      // auth_handler.go Login), KHÔNG so nguyên văn message tiếng Việt — review đối kháng
      // (review-260928-users-pr72-pr28.md finding #5) chỉ ra so chuỗi cứng sẽ âm thầm vỡ nếu
      // backend đổi câu chữ thông báo mà không đổi code.
      if (error instanceof AuthError && error.code === "ACCOUNT_LOCKED") {
        toast.error("Tài khoản đã bị khoá", {
          description: "Vui lòng liên hệ quản trị viên để được hỗ trợ.",
        });
        return;
      }
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
  const { sessionToken, setSessionToken, setActiveRole, setActiveUnifiedRole } = useAuthStore();
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
    onSuccess: async (response) => {
      const data = response.data;

      if (data.completed && data.access_token) {
        // Login hoàn tất
        setSessionToken(null);
        setActiveRole(normalizeRole(data.active_role.role_name));
        setActiveUnifiedRole(data.active_role);
        await bootstrapAuthSession(true);

        qc.invalidateQueries({ queryKey: authKeys.all });

        // Check redirect (e.g., from accept-invitation)
        const redirect = sanitizeRedirect(sessionStorage.getItem("auth_redirect"));
        sessionStorage.removeItem("auth_redirect");
        if (redirect) {
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
  const { setActiveRole, setActiveUnifiedRole } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: authService.switchRole,
    onSuccess: async (response) => {
      const data = response.data;
      if (data.access_token) {
        const newRole = normalizeRole(data.active_role.role_name);
        setActiveRole(newRole);
        setActiveUnifiedRole(data.active_role);
        await bootstrapAuthSession(true);
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
    onError: (error: unknown) => {
      // Trước đây KHÔNG có onError — OTP sai/hết hạn khi đặt lại mật khẩu rơi
      // vào catch{} rỗng ở reset-password/page.tsx (comment cũ ghi nhầm "toast
      // shown in hook"), người dùng bấm "Đặt lại mật khẩu" không thấy phản hồi
      // gì (QA khách P1, 260927 — áp dụng cho luồng quên mật khẩu).
      toast.error(
        translateOtpErrorMessage(
          authErrorMessage(error, "Mã OTP không đúng hoặc đã hết hạn, vui lòng thử lại")
        )
      );
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
    // N9 / P-N1: trước đây không có onError → rơi vào toast mặc định "Error / incorrect current
    // password". Form (account-settings.tsx) còn gắn lỗi ngay dưới ô "Mật khẩu hiện tại".
    onError: (error: unknown) => {
      toast.error("Đổi mật khẩu thất bại", {
        description: getErrorMessage(error, "Không thể đổi mật khẩu, vui lòng thử lại"),
      });
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
      toast.error(getErrorMessage(error, "Không thể ngắt kết nối"));
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
