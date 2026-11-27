/**
 * Admin user-management service
 * Endpoints: GET /users, GET /users/:id, PUT /users/:id/status
 * Contract: plans/260927-2055-role-based-ux-qa/admin-features/phase-01-user-management.md
 * (gán/gỡ vai trò hệ thống tái dùng nguyên roleService.assignSystemRoles/revokeSystemRole —
 * không thêm endpoint mới ở đây theo đúng quyết định trong phase file)
 */

import { api } from "@/lib/api-client";
import { ApiError } from "@/lib/errors";
import type {
  AdminUserDetail,
  AdminUserListParams,
  AdminUserListResponse,
  UpdateUserStatusDTO,
} from "@/types/user";

type R<T> = { message: string; data: T };

const fetchUsers = (params?: AdminUserListParams) =>
  api.get<R<AdminUserListResponse>>("/users", { params }).then((r) => r.data.data);

export const userService = {
  /**
   * GET /users — tìm/lọc/phân trang, quyền USERS_VIEW_ALL.
   *
   * Fallback CÓ TÀI LIỆU cho BACKEND CŨ (Q11-ADMIN-03): `status=self_deleted` bị từ chối 400 "Invalid query params" vì chưa có bộ
   * lọc này. Khi đó (và chỉ khi đó) hỏi lại bằng `status=locked`, tập cha chứa cả tài khoản tự xoá; trang admin lọc tiếp phía
   * client, nên danh sách đúng nhưng tổng số/phân trang là của `locked`. Có cảnh báo trong console; mọi lỗi khác ném nguyên.
   */
  list: async (params?: AdminUserListParams) => {
    try {
      return await fetchUsers(params);
    } catch (error) {
      if (params?.status === "self_deleted" && error instanceof ApiError && error.status === 400) {
        console.warn("[admin/users] backend chưa hỗ trợ status=self_deleted (400); dùng status=locked rồi lọc phía client.");
        return { ...(await fetchUsers({ ...params, status: "locked" })), client_split: true };
      }
      throw error;
    }
  },

  /** GET /users/:id — chi tiết 1 user, quyền USERS_VIEW_ALL */
  getById: (id: string) =>
    api.get<R<AdminUserDetail>>(`/users/${id}`).then((r) => r.data.data),

  /** PUT /users/:id/status — khoá/mở khoá + thu hồi toàn bộ phiên khi khoá, quyền USERS_BAN */
  updateStatus: (id: string, data: UpdateUserStatusDTO) =>
    api.put<R<AdminUserDetail>>(`/users/${id}/status`, data).then((r) => r.data.data),
};
