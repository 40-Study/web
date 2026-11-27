/**
 * Admin user-management type definitions.
 *
 * Khớp contract `GET/PUT /api/users` (Phase 1 quản lý người dùng —
 * plans/260927-2055-role-based-ux-qa/admin-features/phase-01-user-management.md).
 * Giữ nguyên snake_case phía TS — đối chiếu order.service.ts đã dùng thẳng
 * snake_case trong response type, KHÔNG tự chuyển camelCase.
 */

/**
 * `self_deleted`: chỉ tài khoản tự xoá (Q11-ADMIN-03). Backend mới: `locked` KHÔNG gồm tài khoản tự xoá; backend cũ trả 400
 * "Invalid query params" cho `self_deleted` và `locked` gồm cả hai (xem `userService.list`).
 */
export type AdminUserStatusFilter = "active" | "locked" | "self_deleted";

export interface AdminUserListItem {
  id: string;
  email: string;
  user_name: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  locked_reason: string | null;
  locked_at: string | null;
  /**
   * Q10-ADMIN-03: thời điểm người dùng TỰ xoá tài khoản (settings, "Xoá tài khoản"). Backend chỉ gửi trường này ở DTO
   * admin và có thể chưa có (bản cũ): vắng mặt = coi là bị khoá.
   */
  self_deleted_at?: string | null;
  last_login_at: string | null;
  created_at: string;
  system_roles: string[];
}

export interface AdminUserSystemRoleDetail {
  id: string;
  name: string;
  granted_at: string;
}

export interface AdminUserDetail
  extends Omit<AdminUserListItem, "system_roles"> {
  phone: string | null;
  date_of_birth: string | null;
  system_roles: AdminUserSystemRoleDetail[];
}

export interface AdminUserListParams {
  keyword?: string;
  role?: string;
  status?: AdminUserStatusFilter;
  page?: number;
  limit?: number;
}

export interface AdminUserListResponse {
  items: AdminUserListItem[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
  /** KHÔNG phải trường backend: `userService.list` đặt true khi phải hỏi lại bằng `locked` vì backend cũ từ chối `self_deleted` (400). */
  client_split?: boolean;
}

export interface UpdateUserStatusDTO {
  is_active: boolean;
  /** Bắt buộc khi is_active=false, tối đa 500 ký tự. Bỏ qua khi mở khoá. */
  reason?: string;
}
