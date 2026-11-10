/**
 * Hooks quản lý thành viên tổ chức: dùng chung cho /admin/organizations (quản trị hệ thống) và /org/members (chủ tổ chức).
 * Endpoint: GET /org-roles, POST/DELETE /users/:userId/org-roles[/:orgRoleId], GET /users/:userId/org-roles.
 *
 * Lỗi KHÔNG toast ở đây: hộp thoại gọi mutateAsync và hiện lỗi ngay trong hộp thoại (vd. 409 gán trùng) để người dùng
 * thấy lý do cạnh nút bấm, không bị toast che mất.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roleService } from "@/services/role.service";
import { adminKeys } from "@/hooks/queries/use-admin";
import { orgAreaKeys } from "@/hooks/queries/use-org-area";
import { handleMutationError } from "@/lib/query-client";
import { isUncertainOutcomeError } from "@/lib/uncertain-mutation";

export const orgMemberKeys = {
  roles: (orgId: string) => ["org-member-roles", "roles", orgId] as const,
  userMemberships: (userId: string) => ["org-member-roles", "user", userId] as const,
};

/** Vai trò còn dùng được của tổ chức (đưa vào ô chọn vai trò). */
export function useAssignableOrgRoles(orgId: string) {
  return useQuery({
    queryKey: orgMemberKeys.roles(orgId),
    queryFn: async () => (await roleService.listOrgRoles(orgId)).filter((r) => (r.status ?? "active") === "active"),
    enabled: !!orgId,
  });
}

/** Tổ chức + vai trò đang giữ của một người (trang chi tiết người dùng của quản trị viên). */
export function useUserOrgMemberships(userId: string) {
  return useQuery({
    queryKey: orgMemberKeys.userMemberships(userId),
    queryFn: () => roleService.getUserOrgRoles(userId, "active"),
    enabled: !!userId,
  });
}

function useRefreshMembers(orgId: string) {
  const qc = useQueryClient();
  return (userId: string) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: orgAreaKeys.members(orgId) }),
      qc.invalidateQueries({ queryKey: adminKeys.orgMembers(orgId) }),
      qc.invalidateQueries({ queryKey: orgMemberKeys.userMemberships(userId) }),
    ]);
}

export function useAssignOrgMemberRole(orgId: string) {
  const refresh = useRefreshMembers(orgId);
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      roleService.assignOrgRoles(userId, { role_ids: [roleId], organization_id: orgId }),
    onSuccess: (_r, { userId }) => refresh(userId),
  });
}

export function useRevokeOrgMemberRole(orgId: string) {
  const refresh = useRefreshMembers(orgId);
  return useMutation({
    mutationFn: ({ userId, assignmentId }: { userId: string; assignmentId: string }) =>
      roleService.revokeOrgRole(userId, assignmentId),
    onSuccess: (_r, { userId }) => refresh(userId),
    // Timeout/mất mạng (QA-C-16): hộp thoại tự tải lại danh sách và đối chiếu; toast mặc định "Mất kết
    // nối" ở đây sẽ mâu thuẫn với kết quả đối chiếu. Lỗi khác giữ toast mặc định như trước.
    onError: (error) => {
      if (!isUncertainOutcomeError(error)) handleMutationError(error);
    },
  });
}
