/**
 * Tên event window dùng chung giữa api-client (phát) và AuthBootstrap (nghe).
 *
 * Tách file riêng vì api-client KHÔNG được import auth-session (auth-session → auth.service →
 * api-client: vòng import).
 */

/** Refresh token trả `role_changed: true` — vai trò của user vừa đổi phía server (Phase 3). */
export const AUTH_ROLE_CHANGED_EVENT = "fortex:auth-role-changed";

export interface AuthRoleChangedDetail {
  /** Vai trò active mới server gán (vd "TEACHER" sau khi hồ sơ giảng viên được duyệt). */
  activeRole: string | null;
}
