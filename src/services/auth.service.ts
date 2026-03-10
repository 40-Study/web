/**
 * Authentication service - all auth-related API calls
 */

import { api } from "@/lib/api-client";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface RegisterRequestDTO {
  email: string;
  phone?: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  otp: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  device_name?: string;
}

export interface LoginResponse {
  session_token: string;
  system_roles: string[];
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

export interface SelectProfileDTO {
  role: string;
}

export interface SelectOrgDTO {
  organization_id: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface Device {
  id: string;
  name: string;
  last_active: string;
  ip_address: string;
  is_current: boolean;
}

export interface ResetPasswordRequestDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  password: string;
}

export interface ChangePasswordDTO {
  current_password: string;
  new_password: string;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
}

export interface OrgRole {
  id: string;
  name: string;
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
    api.post<{ user_id: string }>("/auth/register", data).then((r) => r.data),

  // ─── Login Flow ─────────────────────────────────────────────────────────

  /** Login - returns session token + roles */
  login: (data: LoginDTO) =>
    api.post<LoginResponse>("/auth/login", data).then((r) => r.data),

  /** Select profile/role after login */
  selectProfile: (data: SelectProfileDTO) =>
    api.post<{ organizations: Organization[] }>("/auth/select-profile", data).then((r) => r.data),

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
    api.post<TokenResponse>("/auth/refresh", {}).then((r) => r.data),

  // ─── Session Management ─────────────────────────────────────────────────

  /** Get current user info */
  getMe: () =>
    api.get<{ user: LoginResponse["user"]; permissions: string[] }>("/auth/me").then((r) => r.data),

  /** Logout current device */
  logout: () =>
    api.post<void>("/auth/logout", {}).then((r) => r.data),

  /** Logout all devices */
  logoutAll: () =>
    api.post<void>("/auth/logout-all", {}).then((r) => r.data),

  /** Get all logged-in devices */
  getDevices: () =>
    api.get<{ devices: Device[] }>("/auth/devices").then((r) => r.data),

  /** Logout specific device */
  logoutDevice: (deviceId: string) =>
    api.post<void>(`/auth/devices/${deviceId}/logout`, {}).then((r) => r.data),

  // ─── Password Reset ─────────────────────────────────────────────────────

  /** Request password reset OTP */
  resetPasswordRequest: (data: ResetPasswordRequestDTO) =>
    api.post<{ message: string }>("/auth/reset-password/request", data).then((r) => r.data),

  /** Complete password reset */
  resetPassword: (data: ResetPasswordDTO) =>
    api.post<{ message: string }>("/auth/reset-password", data).then((r) => r.data),

  /** Change password (authenticated) */
  changePassword: (data: ChangePasswordDTO) =>
    api.post<{ message: string }>("/auth/change-password", data).then((r) => r.data),

  // ─── Profile Data ───────────────────────────────────────────────────────

  /** Get user's organizations */
  getMyOrganizations: () =>
    api.get<{ organizations: Organization[] }>("/me/organizations").then((r) => r.data),

  /** Get user's org roles */
  getMyOrgRoles: () =>
    api.get<{ roles: OrgRole[] }>("/me/org-roles").then((r) => r.data),

  /** Get children (for parent role) */
  getChildren: () =>
    api.get<{ children: Child[] }>("/me/children").then((r) => r.data),
};
