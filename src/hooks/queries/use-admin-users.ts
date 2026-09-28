/**
 * React Query hooks — Quản lý người dùng (admin)
 * Gán/gỡ vai trò hệ thống gọi lại roleService đã có sẵn (không có endpoint mới).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userService } from "@/services/user.service";
import { roleService } from "@/services/role.service";
import { ApiError } from "@/lib/errors";
import type { AdminUserListParams, UpdateUserStatusDTO } from "@/types/user";

export const adminUserKeys = {
  all: ["admin-users"] as const,
  list: (params: AdminUserListParams) => [...adminUserKeys.all, "list", params] as const,
  detail: (id: string) => [...adminUserKeys.all, "detail", id] as const,
};

function extractErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.message ? error.message : fallback;
}

/** GET /users — danh sách + tìm + lọc + phân trang */
export function useAdminUsers(params: AdminUserListParams) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => userService.list(params),
    // Giữ dữ liệu trang cũ khi đổi filter/trang — tránh nháy toàn bộ bảng về loading.
    placeholderData: (prev) => prev,
  });
}

/** GET /users/:id — chi tiết 1 user */
export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: adminUserKeys.detail(id),
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
}

/** PUT /users/:id/status — khoá/mở khoá tài khoản */
export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserStatusDTO }) =>
      userService.updateStatus(id, data),
    onSuccess: (_result, { id, data }) => {
      qc.invalidateQueries({ queryKey: adminUserKeys.all });
      qc.invalidateQueries({ queryKey: adminUserKeys.detail(id) });
      toast.success(data.is_active ? "Đã mở khoá tài khoản" : "Đã khoá tài khoản");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Không thể cập nhật trạng thái tài khoản"));
    },
  });
}

/** POST /users/:userId/system-roles — gán vai trò (endpoint có sẵn) */
export function useAssignUserSystemRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, systemRoleId }: { userId: string; systemRoleId: string }) =>
      roleService.assignSystemRoles(userId, { system_role_ids: [systemRoleId] }),
    onSuccess: (_result, { userId }) => {
      qc.invalidateQueries({ queryKey: adminUserKeys.detail(userId) });
      qc.invalidateQueries({ queryKey: adminUserKeys.all });
      toast.success("Đã thêm vai trò");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Không thể thêm vai trò"));
    },
  });
}

/** DELETE /users/:userId/system-roles/:systemRoleId — gỡ vai trò (endpoint có sẵn) */
export function useRevokeUserSystemRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, systemRoleId }: { userId: string; systemRoleId: string }) =>
      roleService.revokeSystemRole(userId, systemRoleId),
    onSuccess: (_result, { userId }) => {
      qc.invalidateQueries({ queryKey: adminUserKeys.detail(userId) });
      qc.invalidateQueries({ queryKey: adminUserKeys.all });
      toast.success("Đã gỡ vai trò");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Không thể gỡ vai trò"));
    },
  });
}
