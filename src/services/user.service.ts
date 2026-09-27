/**
 * Admin user-management service
 * Endpoints: GET /users, GET /users/:id, PUT /users/:id/status
 * Contract: plans/260927-2055-role-based-ux-qa/admin-features/phase-01-user-management.md
 * (gán/gỡ vai trò hệ thống tái dùng nguyên roleService.assignSystemRoles/revokeSystemRole —
 * không thêm endpoint mới ở đây theo đúng quyết định trong phase file)
 */

import { api } from "@/lib/api-client";
import type {
  AdminUserDetail,
  AdminUserListParams,
  AdminUserListResponse,
  UpdateUserStatusDTO,
} from "@/types/user";

type R<T> = { message: string; data: T };

export const userService = {
  /** GET /users — tìm/lọc/phân trang, quyền USERS_VIEW_ALL */
  list: (params?: AdminUserListParams) =>
    api.get<R<AdminUserListResponse>>("/users", { params }).then((r) => r.data.data),

  /** GET /users/:id — chi tiết 1 user, quyền USERS_VIEW_ALL */
  getById: (id: string) =>
    api.get<R<AdminUserDetail>>(`/users/${id}`).then((r) => r.data.data),

  /** PUT /users/:id/status — khoá/mở khoá + thu hồi toàn bộ phiên khi khoá, quyền USERS_BAN */
  updateStatus: (id: string, data: UpdateUserStatusDTO) =>
    api.put<R<AdminUserDetail>>(`/users/${id}/status`, data).then((r) => r.data.data),
};
