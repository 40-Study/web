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
import {
  ACCOUNT_DELETED_DESCRIPTION,
  ACCOUNT_DELETED_TITLE,
  ApiError,
  AuthError,
  RateLimitError,
  isAccountDeletedError,
} from "@/lib/errors";
import { getErrorMessage } from "@/lib/error-messages";
import { deleteAccountErrorMessage, isDeleteAccountPasswordError } from "@/lib/account-deletion";
import { isUsernameTakenError } from "@/lib/user-name";
import { sanitizeRedirect } from "@/lib/safe-redirect";
import { AUTH_ROUTES } from "@/lib/routes";
import { STORAGE_KEYS } from "@/lib/constants";
import { markOneShotPage } from "@/hooks/use-one-shot-page";

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
    // Hiện lý do thật của backend (vd. user_name sai định dạng) thay vì câu chung "Cập nhật thất bại"
    // (QA hồi quy A-09); lỗi không có lý do dùng được vẫn rơi về câu chung.
    onError: (error) => {
      // Q8-PG-02: tên đăng nhập trùng hiện dưới ô Username của form (profile-settings), không thêm toast thứ hai.
      if (isUsernameTakenError(error)) return;
      toast.error(getErrorMessage(error, "Cập nhật thất bại"));
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
      // Sai mật khẩu / 429 / khoá tài khoản là kết quả bình thường và có toast riêng; chỉ log lỗi bất ngờ (Q6-PG-19).
      if (!(error instanceof ApiError)) console.error("Login error:", error);
      // A-P3-1 (verify-260927-student-admin.md): trước đây LUÔN hiện "Email
      // hoặc mật khẩu không đúng" bất kể lỗi thật là gì — bị rate-limit 429
      // (bucket 5 lần/phút/IP của /login, riêng với /refresh-token) cũng hiện y hệt
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
      // Q9-PG-05: tự vô hiệu hoá tài khoản khác với bị admin khoá (so theo `code`, như ACCOUNT_LOCKED).
      if (isAccountDeletedError(error)) {
        toast.error(ACCOUNT_DELETED_TITLE, { description: ACCOUNT_DELETED_DESCRIPTION });
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
    // G-08 (QA3 261104): mọi nơi gọi đều hiện lỗi cụ thể ngay trên form; không để toast mặc định
    // ("Không thể thực hiện thao tác") hiện thêm kênh thứ hai.
    onError: () => {},
  });
}

/** Contract 8: resend-otp trả 410 mã này khi không còn đăng ký đang chờ (quá 5 phút, đã xác thực, chưa từng gửi). */
export const REGISTRATION_EXPIRED_CODE = "ERR_REGISTRATION_EXPIRED";
export const REGISTRATION_EXPIRED_MESSAGE = "Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại.";

/** Nhận theo `code` (không theo câu chữ): api-client ưu tiên field `error` của body hơn `message`. */
export function isRegistrationExpiredError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 410 && error.code === REGISTRATION_EXPIRED_CODE;
}

/** POST /auth/register/resend-otp - Gửi lại OTP đăng ký chỉ bằng email (N-07); trang gọi tự báo lỗi. */
export function useRegisterResendOtp() {
  return useMutation({
    mutationFn: authService.registerResendOtp,
    onSuccess: () => {
      toast.success("Mã OTP mới đã được gửi");
    },
    onError: () => {},
  });
}

/** POST /auth/register - Complete registration */
export function useRegister() {
  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      toast.success("Đăng ký thành công!");
    },
    // G-08: OTP sai đã hiện inline (otp/page.tsx, modal đăng ký) nên không toast thêm.
    onError: () => {},
  });
}

/** Backend #146: vai tổ chức trùng tên vai hệ thống bị từ chối; thử lại vô ích nên phải nói rõ lý do và ai sửa được. */
function isReservedOrgRoleError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "ORG_ROLE_NAME_RESERVED";
}

/**
 * POST /auth/select-role - Select role during login flow (uses session_token)
 * Completes login: returns tokens, sets auth state, navigates to home.
 */
/** Không còn session_token của bước đăng nhập (làm mới trang giữa chừng, tab khác, token đã xoá). */
class MissingRoleSelectionSessionError extends Error {
  constructor() {
    super("No session token");
    this.name = "MissingRoleSelectionSessionError";
  }
}

export function useSelectRole() {
  const { sessionToken, setSessionToken, setActiveRole, setActiveUnifiedRole, restoreSessionToken } = useAuthStore();
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (params: {
      roleId: string;
      roleType: "system" | "organization";
      organizationId?: string;
    }) => {
      // Token của bước chọn vai trò sống trong sessionStorage: thử đọc lại trước khi coi là mất phiên.
      const token = sessionToken ?? restoreSessionToken();
      if (!token) throw new MissingRoleSelectionSessionError();
      return authService.selectRole({
        session_token: token,
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
      // QA3-19: mất phiên đăng nhập giữa chừng (vd F5 ở /login/role) không phải lỗi "chọn vai trò thất bại"
      // để người dùng bấm lại vô ích: báo rõ và đưa về trang đăng nhập.
      if (error instanceof MissingRoleSelectionSessionError) {
        toast.error("Phiên đăng nhập đã hết hạn", { description: "Vui lòng đăng nhập lại để chọn vai trò." });
        router.replace("/login");
        return;
      }
      console.error("Select role error:", error);
      if (isReservedOrgRoleError(error)) {
        toast.error(getErrorMessage(error));
        return;
      }
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
      toast.error(isReservedOrgRoleError(error) ? getErrorMessage(error) : "Đổi vai trò thất bại");
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
    // P-07: trước đây lỗi chỉ rơi vào toast mặc định chung chung.
    onError: (error: unknown) => {
      toast.error("Không thể đăng xuất tất cả thiết bị", {
        description: getErrorMessage(error, "Vui lòng thử lại sau"),
      });
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

/** Backend gộp kiểm OTP và đặt mật khẩu mới vào một lần gọi; lỗi OTP luôn có chữ "OTP" trong message. */
export function isResetOtpError(error: unknown): boolean {
  return error instanceof ApiError && /\bOTP\b/i.test(error.message);
}

/**
 * Mã đã CHẾT, không thử lại được: backend đã xoá khoá OTP (auth_service.go ~1451-1482: "OTP not found or expired",
 * "OTP has expired", "too many failed attempts, please request a new OTP"). Khác "invalid OTP, N attempts
 * remaining" (mã sai nhưng còn sống). Người dùng phải xin mã MỚI, không có gì để nhập lại.
 */
export function isResetOtpGoneError(error: unknown): boolean {
  return error instanceof ApiError && /OTP not found or expired|OTP has expired|too many failed attempts/i.test(error.message);
}

/** POST /auth/reset-password */
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      toast.success("Đặt lại mật khẩu thành công");
      markOneShotPage(STORAGE_KEYS.RESET_PASSWORD_SUCCESS_FLAG);
      router.push(AUTH_ROUTES.RESET_PASSWORD_SUCCESS);
    },
    onError: (error: unknown) => {
      const message = translateOtpErrorMessage(
        authErrorMessage(error, "Mã OTP không đúng hoặc đã hết hạn, vui lòng thử lại")
      );
      // Q5-PG-05: OTP chỉ được kiểm ở bước cuối này. Trước đây chỉ có toast và trang vẫn giữ mã sai trong
      // sessionStorage: người dùng không có chỗ nhập lại, bấm gửi lại thì gửi cùng mã sai và tốn lượt thử.
      // Mã đã CHẾT (review M1): về /forgot-password giữ email, người dùng bấm gửi mã mới ngay. KHÔNG đưa về
      // bước OTP: ở đó nút "Gửi lại mã" bị ẩn 90 giây và mã gõ vào lại bị từ chối tiếp.
      if (isResetOtpGoneError(error)) {
        const email = sessionStorage.getItem(STORAGE_KEYS.RESET_PASSWORD_EMAIL);
        sessionStorage.removeItem(STORAGE_KEYS.RESET_PASSWORD_OTP);
        sessionStorage.removeItem(STORAGE_KEYS.RESET_PASSWORD_EMAIL);
        if (email) sessionStorage.setItem(STORAGE_KEYS.RESET_PASSWORD_PREFILL_EMAIL, email);
        sessionStorage.setItem(
          STORAGE_KEYS.RESET_PASSWORD_GONE_NOTICE,
          /too many failed attempts/i.test((error as ApiError).message)
            ? "Bạn đã nhập sai quá nhiều lần nên mã đã bị huỷ. Vui lòng nhận mã mới."
            : "Mã OTP đã hết hạn. Vui lòng nhận mã mới.",
        );
        router.push(AUTH_ROUTES.FORGOT_PASSWORD);
        return;
      }
      // Mã SAI nhưng còn lượt: xoá mã sai rồi đưa về bước nhập OTP, câu lỗi hiện ngay dưới 6 ô (không toast thêm
      // lần nữa, như N-06).
      if (isResetOtpError(error)) {
        sessionStorage.removeItem(STORAGE_KEYS.RESET_PASSWORD_OTP);
        sessionStorage.setItem(STORAGE_KEYS.RESET_PASSWORD_OTP_ERROR, message);
        router.push(AUTH_ROUTES.FORGOT_PASSWORD_OTP);
        return;
      }
      // Các lỗi khác (mật khẩu yếu, 429...) vẫn ở lại trang với toast. Trước đây KHÔNG có onError nên người
      // dùng bấm "Đặt lại mật khẩu" không thấy phản hồi (QA khách P1, 260927).
      toast.error(message);
    },
  });
}

/**
 * Backend trả 400 "incorrect current password" khi sai mật khẩu hiện tại. Lỗi này gắn được vào đúng ô nhập
 * (account-settings.tsx), nên hook KHÔNG toast thêm (N-06, QA4 261123: từng hiện cả inline lẫn toast).
 */
export function isIncorrectCurrentPasswordError(error: unknown): boolean {
  return error instanceof ApiError && /incorrect current password/i.test(error.message);
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
      if (isIncorrectCurrentPasswordError(error)) return;
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
    onError: (error: unknown) => {
      // Sai mật khẩu: lỗi hiện dưới ô nhập trong hộp thoại (account-settings.tsx), không toast thêm (Q9-PG-05).
      if (isDeleteAccountPasswordError(error)) return;
      toast.error(deleteAccountErrorMessage(error));
    },
  });
}
