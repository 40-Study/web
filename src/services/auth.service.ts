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
  role_ids?: string[];
}

export interface RegisterDTO {
  email: string;
  otp: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  device_info?: {
    name: string;
    os?: string;
    browser?: string;
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
    session_token: string;
    system_roles: SystemRole[];
    user: {
      id: string;
      email: string;
      name: string;
      avatar?: string;
    };
  };
}

export interface SelectProfileDTO {
  session_token: string;
  system_role_id: string;
}

export interface SelectOrgDTO {
  organization_id: string;
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
}

export interface ChangePasswordDTO {
  current_password: string;
  new_password: string;
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
