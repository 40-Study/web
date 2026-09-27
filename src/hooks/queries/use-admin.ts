/**
 * React Query hooks for admin operations
 */

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { organizationService } from "@/services/organization.service";
import { permissionService } from "@/services/permission.service";
import { roleService } from "@/services/role.service";

// Query Keys
export const adminKeys = {
  all: ["admin"] as const,
  orgs: () => [...adminKeys.all, "organizations"] as const,
  org: (id: string) => [...adminKeys.all, "organization", id] as const,
  orgMembers: (id: string) => [...adminKeys.all, "org-members", id] as const,
  orgRoles: (orgId: string) => [...adminKeys.all, "org-roles", orgId] as const,
  systemRoles: () => [...adminKeys.all, "system-roles"] as const,
  systemRoleUsers: (roleId: string) => [...adminKeys.all, "system-role-users", roleId] as const,
  systemRolePermissions: (roleId: string) => [...adminKeys.all, "system-role-permissions", roleId] as const,
  permissions: () => [...adminKeys.all, "permissions"] as const,
};

// Organizations
export function useOrganizations() {
  return useQuery({
    queryKey: adminKeys.orgs(),
    queryFn: organizationService.list,
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: adminKeys.org(id),
    queryFn: () => organizationService.getById(id),
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: organizationService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.orgs() });
      toast.success("Tạo tổ chức thành công");
    },
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof organizationService.update>[1] }) =>
      organizationService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.orgs() });
      toast.success("Cập nhật thành công");
    },
  });
}

export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: organizationService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.orgs() });
      toast.success("Xóa tổ chức thành công");
    },
  });
}

export function useOrgMembers(orgId: string) {
  return useQuery({
    queryKey: adminKeys.orgMembers(orgId),
    queryFn: () => organizationService.getMembers(orgId),
    enabled: !!orgId,
  });
}

// Roles
export function useOrgRoles(orgId: string) {
  return useQuery({
    queryKey: adminKeys.orgRoles(orgId),
    queryFn: () => roleService.listOrgRoles(),
    enabled: !!orgId,
  });
}

export function useSystemRoles() {
  return useQuery({
    queryKey: adminKeys.systemRoles(),
    queryFn: roleService.listSystemRoles,
  });
}

/**
 * A-P2-2: dashboard cần số user thật theo từng vai trò để sắp "Top vai trò" và tính tổng —
 * GET /system-roles/:id/users chỉ trả TOTAL cho 1 role/lần, không có endpoint tổng hợp sẵn, nên
 * gọi song song cho từng role (chỉ 6 role hệ thống — quy mô nhỏ, không cần fan-out phức tạp).
 * Lưu ý: tổng là TỔNG SỐ LƯỢT GÁN theo role, một user có 2 role sẽ được đếm 2 lần.
 */
export function useSystemRolesWithUserCounts() {
  const { data: roles = [], isLoading: rolesLoading, isError: rolesError, refetch: refetchRoles } = useSystemRoles();

  const countQueries = useQueries({
    queries: roles.map((role) => ({
      queryKey: adminKeys.systemRoleUsers(role.id),
      queryFn: () => roleService.getSystemRoleUsers(role.id, { page_size: 1 }),
      enabled: roles.length > 0,
    })),
  });

  const countsLoading = roles.length > 0 && countQueries.some((q) => q.isLoading);
  const rolesWithCounts = roles.map((role, index) => ({
    ...role,
    userCount: countQueries[index]?.data?.total ?? null,
  }));

  const totalAssignedUsers = countQueries.every((q) => q.data)
    ? countQueries.reduce((sum, q) => sum + (q.data?.total ?? 0), 0)
    : null;

  return {
    roles: rolesWithCounts,
    totalAssignedUsers,
    isLoading: rolesLoading || countsLoading,
    isError: rolesError,
    refetch: refetchRoles,
  };
}

export function usePermissions() {
  return useQuery({
    queryKey: adminKeys.permissions(),
    queryFn: permissionService.getAll,
  });
}

// A-P1-3: backend chỉ có PUT /permissions/:id (sửa description) — KHÔNG có POST/DELETE.
export function useUpdatePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, description }: { id: string; description: string }) =>
      permissionService.update(id, { description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.permissions() });
      toast.success("Đã cập nhật mô tả quyền");
    },
  });
}

export function useCreateOrgRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: Omit<Parameters<typeof roleService.createOrgRole>[0], "organization_id"> }) =>
      roleService.createOrgRole({ ...data, organization_id: orgId }),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.orgRoles(orgId) });
      toast.success("Tạo vai trò thành công");
    },
  });
}

export function useCreateSystemRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roleService.createSystemRole,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.systemRoles() });
      toast.success("Tạo vai trò hệ thống thành công");
    },
  });
}

export function useUpdateSystemRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: Parameters<typeof roleService.updateSystemRole>[1] }) =>
      roleService.updateSystemRole(roleId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.systemRoles() });
      toast.success("Cập nhật vai trò hệ thống thành công");
    },
  });
}

export function useDeleteSystemRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roleService.deleteSystemRole,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.systemRoles() });
      toast.success("Xóa vai trò hệ thống thành công");
    },
  });
}

// ─── System role: users thật theo vai trò (A-P1-1) ─────────────────────────
// GET /system-roles/:id/users — real data, không còn seedUsersForRole giả.

export function useSystemRoleUsers(roleId: string | null) {
  return useQuery({
    queryKey: roleId ? adminKeys.systemRoleUsers(roleId) : [...adminKeys.all, "system-role-users", "none"],
    queryFn: () => roleService.getSystemRoleUsers(roleId as string, { page_size: 100 }),
    enabled: !!roleId,
  });
}

export function useAssignSystemRoleToUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string; notes?: string }) =>
      roleService.assignSystemRoles(userId, { system_role_ids: [roleId] }),
    onSuccess: (_, { roleId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.systemRoleUsers(roleId) });
      toast.success("Đã gán vai trò cho user");
    },
  });
}

export function useRevokeSystemRoleFromUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      roleService.revokeSystemRole(userId, roleId),
    onSuccess: (_, { roleId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.systemRoleUsers(roleId) });
      toast.success("Đã gỡ vai trò khỏi user");
    },
  });
}

// ─── System role: quyền của vai trò (A-P1-2) ────────────────────────────────
// Tạo/sửa role phải lưu và nạp lại đúng danh sách quyền đã tick.

export function useSystemRolePermissions(roleId: string | null) {
  return useQuery({
    queryKey: roleId ? adminKeys.systemRolePermissions(roleId) : [...adminKeys.all, "system-role-permissions", "none"],
    queryFn: () => roleService.getSystemRolePermissions(roleId as string),
    enabled: !!roleId,
  });
}

export function useSetSystemRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      roleService.setSystemRolePermissions(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.systemRolePermissions(roleId) });
    },
  });
}

export function useAssignOrgRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, orgId, roleId }: { userId: string; orgId: string; roleId: string }) =>
      roleService.assignOrgRoles(userId, { role_ids: [roleId], organization_id: orgId }),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.orgMembers(orgId) });
      toast.success("Gán vai trò thành công");
    },
  });
}
