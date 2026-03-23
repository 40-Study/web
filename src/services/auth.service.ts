/**
 * Authentication service - all auth-related API calls
 */

import { api } from "@/lib/api-client";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface RegisterRequestDTO {
  email: string;
  password: string;
  confirm_password: string;
  user_name: string;
  full_name?: string;
  role_id: string; // Single UUID, required by backend
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

// Helper to get or create device ID
export function getDeviceId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();

  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
}

// Helper to detect OS
function getOS(): string {
  if (typeof window === "undefined") return "Unknown";

  const ua = navigator.userAgent;
  // Check for Windows version
  if (ua.includes("Windows NT 10.0")) {
    // Windows 10 or 11 (both report NT 10.0)
    // Try to detect Windows 11 via user agent hints or default to Windows 10
    return "Windows 11";
  }
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

// Helper to get device name
function getDeviceName(): string {
  if (typeof window === "undefined") return "Unknown Device";

  const ua = navigator.userAgent;
  // Try to extract browser name
  if (ua.includes("Chrome")) return "Chrome Browser";
  if (ua.includes("Firefox")) return "Firefox Browser";
  if (ua.includes("Safari")) return "Safari Browser";
  if (ua.includes("Edge")) return "Edge Browser";
  return "Web Browser";
}

// Get complete device info for login
export function getDeviceInfo(): DeviceInfo {
  return {
    device_id: getDeviceId(),
    device_name: getDeviceName(),
    os: getOS(),
    app_version: "1.0.0",
    user_agent: typeof window !== "undefined" ? navigator.userAgent : undefined,
  };
}

export interface SystemRole {
  id: string;
  name: string;
  description?: string;
}

export interface LoginResponse {
  message: string;
  data: {
    // Direct login (1 role, 0 orgs) - backend returns tokens directly
    access_token?: string;
    refresh_token?: string;
    user: {
      id: string;
      username?: string;
      email: string;
      name?: string;
      avatar?: string;
      is_active?: boolean;
    };
    current_device?: {
      device_id: string;
      device_name: string;
      logged_in_at: string;
    };
    // Multi-step login flow (multiple roles or orgs)
    session_token?: string;
    system_roles?: SystemRole[];
    completed?: boolean;
    active_role?: SystemRole;
    active_org?: { id: string; name: string } | null;
    requires_org_selection?: boolean;
    organizations?: Array<{ id: string; name: string; code?: string }>;
  };
}

export interface SelectProfileDTO {
  session_token: string;
  system_role_id: string;
}

export interface SelectOrgDTO {
  organization_id: string;
}

export interface MyProfileResponse {
  user: {
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
  };
  system_roles: SystemRole[];
  organizations: Array<{
    id: string;
    name: string;
    member_role?: string;
    status?: string;
  }>;
  active_role?: SystemRole;
  active_org?: { id: string; name: string };
}

export interface UpdateProfileDTO {
  username?: string;
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  bio?: string;
  avatar_url?: string;
}

export interface TokenResponse {
  message: string;
  data: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

export interface Device {
  device_id: string;
  device_name: string;
  logged_in_at: string;
  ip_address?: string;
  is_current?: boolean;
}

export interface DevicesResponse {
  message: string;
  data: {
    devices: Device[];
  };
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
  code: string;
  logo?: string;
}

export interface OrgRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface Child {
  id: string;
  name: string;
  avatar?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════════════════════

export const authService = {
  // ─── Registration ───────────────────────────────────────────────────────

  /** Request OTP for registration */
  registerRequest: (data: RegisterRequestDTO) =>
    api.post<{ message: string }>("/auth/register/request", data).then((r) => r.data),

  /** Complete registration with OTP */
  register: (data: RegisterDTO) =>
    api.post<{ message: string; data: { user: { id: string; email: string; name: string } } }>("/auth/register", data).then((r) => r.data),

  // ─── Login Flow ─────────────────────────────────────────────────────────

  /** Login - returns session token + roles */
  login: (data: LoginDTO) =>
    api.post<LoginResponse>("/auth/login", data).then((r) => r.data),

  /** Select profile/role after login */
  selectProfile: (data: SelectProfileDTO) =>
    api.post<{ message: string; data: { organizations: Organization[] } }>("/auth/select-profile", data).then((r) => r.data),

  /** Select organization */
  selectOrg: (data: SelectOrgDTO) =>
    api.post<TokenResponse>("/auth/select-org", data).then((r) => r.data),

  /** Switch to different profile/role */
  switchProfile: (data: SelectProfileDTO) =>
    api.post<TokenResponse>("/auth/switch-profile", data).then((r) => r.data),

  /** Switch to different organization */
  switchOrg: (data: SelectOrgDTO) =>
    api.post<TokenResponse>("/auth/switch-org", data).then((r) => r.data),

  // ─── Token Management ───────────────────────────────────────────────────

  /** Refresh access token */
  refreshToken: () =>
    api.post<TokenResponse>("/auth/refresh-token", {}).then((r) => r.data),

  // ─── Session Management ─────────────────────────────────────────────────

  /** Get current user info */
  getMe: () =>
    api.get<{ message: string; data: { user: LoginResponse["data"]["user"]; permissions: string[] } }>("/auth/me").then((r) => r.data.data),

  /** Get full profile (user + roles + orgs + active context) */
  getMyProfile: () =>
    api.get<{ message: string; data: MyProfileResponse }>("/auth/me/profile").then((r) => r.data.data),

  /** Update profile */
  updateProfile: (data: UpdateProfileDTO) =>
    api.put<{ message: string; data: MyProfileResponse["user"] }>("/auth/me", data).then((r) => r.data.data),

  /** Logout current device */
  logout: () =>
    api.post<{ message: string }>("/auth/logout", {}).then((r) => r.data),

  /** Logout all devices */
  logoutAll: () =>
    api.post<{ message: string }>("/auth/logout-all", {}).then((r) => r.data),

  /** Get all logged-in devices */
  getDevices: () =>
    api.get<DevicesResponse>("/auth/devices").then((r) => r.data.data),

  // Note: Backend does not support per-device logout, only logout current

  // ─── Password Reset ─────────────────────────────────────────────────────

  /** Request password reset OTP */
  resetPasswordRequest: (data: ResetPasswordRequestDTO) =>
    api.post<{ message: string }>("/auth/reset-password/request", data).then((r) => r.data),

  /** Complete password reset */
  resetPassword: (data: ResetPasswordDTO) =>
    api.post<{ message: string }>("/auth/reset-password", data).then((r) => r.data),

  /** Change password (authenticated) */
  changePassword: (data: ChangePasswordDTO) =>
    api.put<{ message: string }>("/auth/change-password", data).then((r) => r.data),

  // ─── Profile Data ───────────────────────────────────────────────────────

  /** Get user's organizations */
  getMyOrganizations: () =>
    api.get<{ message: string; data: { organizations: Organization[] } }>("/me/organizations").then((r) => r.data.data),

  /** Get user's org roles */
  getMyOrgRoles: () =>
    api.get<{ message: string; data: { roles: OrgRole[] } }>("/me/org-roles").then((r) => r.data.data),

  /** Get children (for parent role) */
  getChildren: () =>
    api.get<{ message: string; data: { children: Child[] } }>("/me/children").then((r) => r.data.data),

  /** Get my system roles */
  getMySystemRoles: () =>
    api.get<{ message: string; data: { system_roles: SystemRole[] } }>("/me/system-roles").then((r) => r.data.data),
};
