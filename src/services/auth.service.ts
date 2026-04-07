/**
 * Authentication service - all auth-related API calls
 * Aligned with backend routes: POST /auth/login, /auth/select-role, /auth/switch-role, etc.
 */

import { api } from "@/lib/api-client";
import { STORAGE_KEYS, APP_VERSION } from "@/lib/constants";
import type { UnifiedRole } from "@/stores/auth.store";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface RegisterRequestDTO {
  email: string;
  password: string;
  confirm_password: string;
  user_name: string;
  full_name?: string;
}

export interface RegisterDTO {
  email: string;
  otp: string;
}

export interface DeviceInfo {
  device_id: string;
  device_name: string;
  os: string;
  app_version?: string;
  user_agent?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  device_info: DeviceInfo;
}

// Backend UserResponseDto
export interface UserResponseDto {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  bio?: string;
  is_active: boolean;
  created_at: string;
}

// Backend DeviceSessionDto
export interface DeviceSessionDto {
  device_id: string;
  device_name: string;
  user_agent?: string;
  logged_in_at: string;
  is_current?: boolean;
}

// Backend EntryContext
export interface EntryContext {
  primary_role: string;
  requires_setup: boolean;
  setup_endpoint?: string;
}

/**
 * Backend LoginResponseDto - Multi-step login:
 * - 0 roles: completed=false, needs_role_registration=true, session_token, user
 * - 1 role: completed=true, access_token, refresh_token, user, active_role, current_device
 * - 2+ roles: completed=true, session_token, roles[] (pick one via /auth/select-role)
 */
export interface LoginResponseData {
  completed: boolean;
  session_token?: string;

  // Unified roles (system + org) for multi-role selection
  roles?: UnifiedRole[];
  requires_org_selection?: boolean;
  organizations?: Array<{ id: string; name: string }>;

  // User chưa có role (mới register/OAuth)
  needs_role_registration?: boolean;

  // Present when completed=true and single role auto-login
  access_token?: string;
  refresh_token?: string;
  user?: UserResponseDto;
  active_role?: UnifiedRole;
  entry_context?: EntryContext;
  current_device?: DeviceSessionDto;
}

export interface LoginResponse {
  message: string;
  data: LoginResponseData;
}

/**
 * Backend SelectRoleRequestDto
 * Used for POST /auth/select-role (during login flow, with session_token)
 */
export interface SelectRoleDTO {
  session_token: string;
  role_id: string; // Role definition ID: SystemRole.ID or OrgRole.ID
  role_type: "system" | "organization";
  organization_id?: string; // Required when role_type="organization"
}

/**
 * Backend SwitchRoleRequestDto
 * Used for POST /auth/switch-role (already authenticated)
 */
export interface SwitchRoleDTO {
  role_id: string; // Role definition ID: SystemRole.ID or OrgRole.ID
  role_type: "system" | "organization";
  organization_id?: string; // Required when role_type="organization"
}

/**
 * Backend SelectRoleResponseDto
 * Returned by both /auth/select-role and /auth/switch-role
 */
export interface SelectRoleResponseData {
  completed: boolean;
  session_token?: string;
  requires_org_selection?: boolean;
  organizations?: Array<{ id: string; name: string }>;
  access_token?: string;
  refresh_token?: string;
  user: UserResponseDto;
  active_role: UnifiedRole;
  active_org?: { id: string; name: string };
  entry_context?: EntryContext;
  current_device?: DeviceSessionDto;
}

export interface SelectRoleResponse {
  message: string;
  data: SelectRoleResponseData;
}

export interface SystemRoleOption {
  id: string;
  name: string;
  description?: string;
}

export interface UpdateProfileDTO {
  username?: string;
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  bio?: string;
  avatar_url?: string;
}

export interface ResetPasswordRequestDTO {
  email: string;
}

export interface ResetPasswordDTO {
  email: string;
  otp: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordDTO {
  old_password: string;
  new_password: string;
  confirm_password: string;
  device_info: DeviceInfo;
  revoke_others?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  code?: string;
  logo?: string;
}

export interface Child {
  id: string;
  name: string;
  avatar?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Device helpers
// ═══════════════════════════════════════════════════════════════════════════

export function getDeviceId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();

  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

function getOS(): string {
  if (typeof window === "undefined") return "Unknown";

  const ua = navigator.userAgent;
  if (ua.includes("Windows NT 10.0")) return "Windows 11";
  if (ua.includes("Windows NT 6.3")) return "Windows 8.1";
  if (ua.includes("Windows NT 6.2")) return "Windows 8";
  if (ua.includes("Windows NT 6.1")) return "Windows 7";
  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown";
}

function getDeviceName(): string {
  if (typeof window === "undefined") return "Unknown Device";

  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "Chrome Browser";
  if (ua.includes("Firefox")) return "Firefox Browser";
  if (ua.includes("Safari")) return "Safari Browser";
  if (ua.includes("Edge")) return "Edge Browser";
  return "Web Browser";
}

export function getDeviceInfo(): DeviceInfo {
  return {
    device_id: getDeviceId(),
    device_name: getDeviceName(),
    os: getOS(),
    app_version: APP_VERSION,
    user_agent: typeof window !== "undefined" ? navigator.userAgent : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// OAuth Helper
// ═══════════════════════════════════════════════════════════════════════════

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function startOAuthFlow(provider: "google" | "github" | "facebook") {
  const device = getDeviceInfo();
  const params = new URLSearchParams({
    device_id: device.device_id,
    device_name: device.device_name,
    os: device.os,
  });
  window.location.href = `${API_BASE_URL}/auth/oauth/${provider}?${params.toString()}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════════════════════

export const authService = {
  // ─── Registration ───────────────────────────────────────────────────────

  /** POST /auth/register/request - Request OTP for registration */
  registerRequest: (data: RegisterRequestDTO) =>
    api.post<{ message: string }>("/auth/register/request", data).then((r) => r.data),

  /** POST /auth/register - Complete registration with OTP */
  register: (data: RegisterDTO) =>
    api
      .post<{ message: string; data: { id: string; email: string; user_name: string; full_name?: string } }>(
        "/auth/register",
        data
      )
      .then((r) => r.data),

  // ─── Login Flow ─────────────────────────────────────────────────────────

  /** POST /auth/login - Returns session_token + roles OR access_token directly */
  login: (data: LoginDTO) => api.post<LoginResponse>("/auth/login", data).then((r) => r.data),

  /**
   * POST /auth/select-role - Select a role during login flow (uses session_token)
   * Returns tokens on success, completing the login.
   */
  selectRole: (data: SelectRoleDTO) =>
    api.post<SelectRoleResponse>("/auth/select-role", data).then((r) => r.data),

  /**
   * POST /auth/switch-role - Switch role while already logged in (uses JWT)
   * Returns new tokens with the selected role.
   */
  switchRole: (data: SwitchRoleDTO) =>
    api.post<SelectRoleResponse>("/auth/switch-role", data).then((r) => r.data),

  // ─── Token Management ───────────────────────────────────────────────────

  /** POST /auth/refresh-token - Refresh access token (cookie or body) */
  refreshToken: () =>
    api
      .post<{ message: string; data: { access_token: string; refresh_token: string } }>(
        "/auth/refresh-token",
        {}
      )
      .then((r) => r.data),

  // ─── Role & Profile Management ──────────────────────────────────────────

  /** GET /auth/my-roles - Get unified roles list (requires auth) */
  getMyRoles: () =>
    api
      .get<{ message: string; data: { roles: UnifiedRole[] } }>("/auth/my-roles")
      .then((r) => r.data.data),

  /** GET /auth/system-roles - Get available system roles for registration (public) */
  getAllSystemRoles: () =>
    api
      .get<{ message: string; data: { system_roles: SystemRoleOption[] } }>("/auth/system-roles")
      .then((r) => r.data.data),

  /** GET /auth/me/profiles - Get user's profiles (UserSystemRoles) */
  getMyProfiles: () =>
    api
      .get<{
        message: string;
        data: {
          profiles: Array<{
            id: string;
            system_role_id: string;
            role_name: string;
            description?: string;
            status: string;
            created_at: string;
          }>;
        };
      }>("/auth/me/profiles")
      .then((r) => r.data.data),

  /** POST /auth/me/profiles - Create a new profile (add a system role) */
  createProfile: (data: { system_role_id: string }) =>
    api.post<{ message: string; data: unknown }>("/auth/me/profiles", data).then((r) => r.data),

  /** DELETE /auth/me/profiles/:id - Delete a profile */
  deleteProfile: (profileId: string) =>
    api.delete<{ message: string }>(`/auth/me/profiles/${profileId}`).then((r) => r.data),

  // ─── Session Management ─────────────────────────────────────────────────

  /** GET /auth/me - Get current user info */
  getMe: () =>
    api.get<{ message: string; data: UserResponseDto }>("/auth/me").then((r) => r.data.data),

  /** PUT /auth/me - Update profile */
  updateProfile: (data: UpdateProfileDTO) =>
    api.put<{ message: string; data: UserResponseDto }>("/auth/me", data).then((r) => r.data.data),

  /** POST /auth/logout - Logout current device */
  logout: () => api.post<{ message: string }>("/auth/logout", {}).then((r) => r.data),

  /** POST /auth/logout-all - Logout all devices */
  logoutAll: () => api.post<{ message: string }>("/auth/logout-all", {}).then((r) => r.data),

  /** GET /auth/devices - Get all logged-in devices */
  getDevices: () =>
    api
      .get<{ message: string; data: { devices: DeviceSessionDto[] } }>("/auth/devices")
      .then((r) => r.data.data),

  // ─── Password Reset ─────────────────────────────────────────────────────

  /** POST /auth/reset-password/request - Request password reset OTP */
  resetPasswordRequest: (data: ResetPasswordRequestDTO) =>
    api.post<{ message: string }>("/auth/reset-password/request", data).then((r) => r.data),

  /** POST /auth/reset-password - Complete password reset */
  resetPassword: (data: ResetPasswordDTO) =>
    api.post<{ message: string }>("/auth/reset-password", data).then((r) => r.data),

  /** PUT /auth/change-password - Change password (authenticated) */
  changePassword: (data: ChangePasswordDTO) =>
    api.put<{ message: string }>("/auth/change-password", data).then((r) => r.data),
};
